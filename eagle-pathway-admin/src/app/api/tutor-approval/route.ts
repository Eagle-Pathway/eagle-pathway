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

    const adminSupabase = getAdminSupabase();

    // Upsert tutor verification status using Admin Service Role key
    const { error: upsertErr } = await adminSupabase
      .from('tutors')
      .upsert(
        { 
          user_id: userId, 
          is_verified: isVerified,
          hourly_rate: 400
        }, 
        { onConflict: 'user_id' }
      );

    if (upsertErr) {
      console.error('Tutor approval API upsert error:', upsertErr);
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    // Sync tutor_applications status
    await adminSupabase
      .from('tutor_applications')
      .update({ status: isVerified ? 'approved' : 'rejected' })
      .eq('tutor_id', userId);

    // Sync profile fields to users table if provided
    if (userUpdates && Object.keys(userUpdates).length > 0) {
      await adminSupabase
        .from('users')
        .update(userUpdates)
        .eq('id', userId);
    }

    // Insert notification for the tutor
    const notif = isVerified
      ? { user_id: userId, title: "You've been approved! 🎉", body: 'Your tutor profile is now live on Eagle Pathway.', type: 'application_update', is_read: false }
      : { user_id: userId, title: 'Account Status Update', body: 'Your tutor verification status has been updated.', type: 'application_update', is_read: false };

    try {
      await adminSupabase.from('notifications').insert(notif);
    } catch {
      // Non-critical notification error
    }

    return NextResponse.json({ success: true, isVerified });
  } catch (err: any) {
    console.error('Tutor approval API exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
