import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials missing on server.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, newPassword, title, message } = body;

    const supabaseAdmin = getAdminClient();

    // 0. GET ALL USERS WITH LIVE SUSPENSION STATUS
    if (action === 'get_all_users') {
      const [{ data: dbUsers, error: dbErr }, { data: authData, error: authErr }] = await Promise.all([
        supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ]);

      if (dbErr) {
        return NextResponse.json({ error: dbErr.message }, { status: 500 });
      }

      // Map banned user IDs
      const bannedUserMap = new Map<string, string>();
      if (authData?.users) {
        for (const u of authData.users) {
          if (u.banned_until && new Date(u.banned_until) > new Date()) {
            bannedUserMap.set(u.id, u.banned_until);
          }
        }
      }

      const usersWithStatus = (dbUsers || []).map((u: any) => ({
        ...u,
        is_suspended: bannedUserMap.has(u.id),
        banned_until: bannedUserMap.get(u.id) || null,
      }));

      return NextResponse.json({ users: usersWithStatus });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // 1. GET FULL DETAILS (auth user + db profile + activity stats)
    if (action === 'get_details') {
      const [{ data: dbUser, error: dbErr }, { data: authUser, error: authErr }] = await Promise.all([
        supabaseAdmin.from('users').select('*').eq('id', userId).single(),
        supabaseAdmin.auth.admin.getUserById(userId),
      ]);

      if (dbErr && !dbUser) {
        return NextResponse.json({ error: dbErr.message || 'User not found' }, { status: 404 });
      }

      // Fetch user activity counts
      const [{ count: appsCount }, { count: bookingsCount }, { count: sopsCount }] = await Promise.all([
        supabaseAdmin.from('applications').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true }).eq('student_id', userId),
        supabaseAdmin.from('sop_reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      const isSuspended = !!(authUser?.user?.banned_until && new Date(authUser.user.banned_until) > new Date());

      return NextResponse.json({
        user: {
          ...dbUser,
          is_suspended: isSuspended,
          banned_until: authUser?.user?.banned_until || null,
          last_sign_in_at: authUser?.user?.last_sign_in_at || null,
          email_confirmed_at: authUser?.user?.email_confirmed_at || null,
        },
        stats: {
          applications: appsCount || 0,
          bookings: bookingsCount || 0,
          sop_reviews: sopsCount || 0,
        },
      });
    }

    // 2. SUSPEND USER (100-year ban duration)
    if (action === 'suspend') {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: '876000h',
      });
      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to suspend user' }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'User account has been suspended.', user: data.user });
    }

    // 3. UNSUSPEND USER (Remove ban duration)
    if (action === 'unsuspend') {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
      });
      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to reactivate user' }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'User account has been reactivated.', user: data.user });
    }

    // 4. RESET PASSWORD (generate recovery link or set new password directly)
    if (action === 'reset_password') {
      if (newPassword) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, message: 'Password updated successfully.' });
      } else {
        const { data: userProfile } = await supabaseAdmin.from('users').select('email').eq('id', userId).single();
        if (!userProfile?.email) return NextResponse.json({ error: 'User email not found' }, { status: 400 });
        
        const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: userProfile.email,
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({
          success: true,
          message: 'Password reset link generated.',
          action_link: linkData.properties?.action_link,
        });
      }
    }

    // 5. SEND DIRECT NOTIFICATION / MESSAGE
    if (action === 'send_notification') {
      if (!title || !message) {
        return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
      }
      const { error } = await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        title,
        message,
        read: false,
        created_at: new Date().toISOString(),
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Notification sent to user.' });
    }

    // 6. DELETE USER ACCOUNT (hard delete from Auth & Users table)
    if (action === 'delete') {
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authErr) {
        console.warn('Auth delete warning:', authErr);
      }
      const { error: dbErr } = await supabaseAdmin.from('users').delete().eq('id', userId);
      if (dbErr) {
        return NextResponse.json({ error: dbErr.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'User account deleted permanently.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in /api/admin/users/action:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
