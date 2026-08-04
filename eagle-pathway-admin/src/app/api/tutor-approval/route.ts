import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request) {
  try {
    const { userId, isVerified, userUpdates } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

    const userToken = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;

    const adminSupabase = userToken
      ? createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: `Bearer ${userToken}` } },
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

    let { error: upsertErr } = await adminSupabase
      .from('tutors')
      .upsert(
        { 
          user_id: userId, 
          is_verified: isVerified,
          hourly_rate: 400
        }, 
        { onConflict: 'user_id' }
      );

    if (upsertErr && userToken) {
      const fallbackClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const res = await fallbackClient
        .from('tutors')
        .upsert(
          { user_id: userId, is_verified: isVerified, hourly_rate: 400 },
          { onConflict: 'user_id' }
        );
      upsertErr = res.error;
    }

    if (upsertErr) {
      console.error('Tutor approval API upsert error:', upsertErr);
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await serviceClient
      .from('tutor_applications')
      .update({ status: isVerified ? 'approved' : 'rejected' })
      .eq('tutor_id', userId);

    if (userUpdates && Object.keys(userUpdates).length > 0) {
      await serviceClient
        .from('users')
        .update(userUpdates)
        .eq('id', userId);
    }

    const notif = isVerified
      ? { user_id: userId, title: "You've been approved! 🎉", body: 'Your tutor profile is now live on Eagle Pathway.', type: 'application_update', is_read: false }
      : { user_id: userId, title: 'Account Status Update', body: 'Your tutor verification status has been updated.', type: 'application_update', is_read: false };

    try {
      await serviceClient.from('notifications').insert(notif);
    } catch {
      // Non-critical notification error
    }

    return NextResponse.json({ success: true, isVerified });
  } catch (err: any) {
    console.error('Tutor approval API exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
