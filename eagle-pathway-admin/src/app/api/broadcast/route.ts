import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, getStrictAdminClient } from '@/lib/adminAuthGuard';

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Admin
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) {
      return authResult.errorResponse!;
    }
    
    const { title, body, audience, type, url, targetUrl } = await req.json();
    if (!title || !body || !audience || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const deepLinkUrl = targetUrl || url || '/notifications';

    const supabase = getStrictAdminClient();

    // 2. Get target users
    let query = supabase.from('users').select('id');
    if (audience !== 'all') {
      query = query.eq('role', audience);
    }

    const { data: users, error: userError } = await query;
    if (userError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users found for this audience' }, { status: 404 });
    }

    // Validate notification type against PostgreSQL enum
    const validEnums = ['application_update', 'sop_reviewed', 'new_resource', 'document_rejected', 'document_approved'];
    const safeType = validEnums.includes(type) ? type : 'application_update';

    // 3. Prepare in-app notifications
    const inAppNotifs = users.map(u => ({
      user_id: u.id,
      title,
      body,
      type: safeType,
      is_read: false,
    }));

    // 4. Insert in-app notifications (in batches if large, but Supabase SDK handles arrays up to ~1000 well. We'll chunk to be safe)
    const chunkSize = 500;
    for (let i = 0; i < inAppNotifs.length; i += chunkSize) {
      const chunk = inAppNotifs.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('notifications').insert(chunk);
      if (insertError) console.error('Failed to insert in-app notifications:', insertError);
    }

    // 5. Gather push tokens directly from push_tokens table for target users
    const userIds = users.map(u => u.id);
    const { data: pushRows } = await supabase
      .from('push_tokens')
      .select('token, user_id')
      .in('user_id', userIds);

    const tokens: string[] = Array.from(
      new Set(
        (pushRows || [])
          .map(r => r.token?.trim())
          .filter(t => t && (t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken')))
      )
    );

    // 6. Send Expo push notifications
    if (tokens.length > 0) {
      const expoMessages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: { url: deepLinkUrl },
      }));

      // Expo Push API recommends chunking by 100
      const expoChunkSize = 100;
      for (let i = 0; i < expoMessages.length; i += expoChunkSize) {
        const chunk = expoMessages.slice(i, i + expoChunkSize);
        try {
          const pushResponse = await fetch(EXPO_PUSH_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chunk),
          });
          const pushResult = await pushResponse.json();
          if (!pushResponse.ok) {
            console.error('Expo push API error:', pushResult);
          }
        } catch (pushError) {
          console.error('Failed to send Expo push:', pushError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      notified_count: users.length,
      push_count: tokens.length,
    });
  } catch (e: any) {
    console.error('Broadcast error:', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: e.message?.includes('Authentication') ? 401 : 500 },
    );
  }
}
