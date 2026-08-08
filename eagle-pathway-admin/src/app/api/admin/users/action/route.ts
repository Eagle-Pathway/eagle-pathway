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

    // 0. GET ALL USERS WITH LIVE SUSPENSION & ARCHIVED STATUS
    if (action === 'get_all_users') {
      const [{ data: dbUsers, error: dbErr }, { data: authData, error: authErr }] = await Promise.all([
        supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ]);

      if (dbErr) {
        return NextResponse.json({ error: dbErr.message }, { status: 500 });
      }

      // Map auth metadata (banned status, is_deleted, previous_role)
      const authUserMap = new Map<string, any>();
      if (authData?.users) {
        for (const u of authData.users) {
          authUserMap.set(u.id, u);
        }
      }

      const usersWithStatus = (dbUsers || []).map((u: any) => {
        const authUser = authUserMap.get(u.id);
        const isBanned = !!(authUser?.banned_until && new Date(authUser.banned_until) > new Date());
        const isDeleted = !!(authUser?.user_metadata?.is_deleted || u.role === 'archived');
        const deletedAt = authUser?.user_metadata?.deleted_at || null;

        return {
          ...u,
          is_suspended: isBanned && !isDeleted,
          is_deleted: isDeleted,
          deleted_at: deletedAt,
          previous_role: authUser?.user_metadata?.previous_role || u.role || 'student',
          last_sign_in_at: authUser?.last_sign_in_at || null,
        };
      });

      return NextResponse.json({ users: usersWithStatus });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // 1. GET FULL DETAILS
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

      const isBanned = !!(authUser?.user?.banned_until && new Date(authUser.user.banned_until) > new Date());
      const isDeleted = !!(authUser?.user?.user_metadata?.is_deleted || dbUser.role === 'archived');

      return NextResponse.json({
        user: {
          ...dbUser,
          is_suspended: isBanned && !isDeleted,
          is_deleted: isDeleted,
          deleted_at: authUser?.user?.user_metadata?.deleted_at || null,
          previous_role: authUser?.user?.user_metadata?.previous_role || dbUser.role || 'student',
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

    // 4. SOFT DELETE / ARCHIVE USER
    if (action === 'delete') {
      const { data: currentDbUser } = await supabaseAdmin.from('users').select('role').eq('id', userId).single();
      const currentRole = currentDbUser?.role || 'student';

      // 1. Update Auth user metadata & ban user
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: '876000h',
        user_metadata: { is_deleted: true, deleted_at: new Date().toISOString(), previous_role: currentRole },
      });
      if (authErr) {
        console.warn('Auth soft delete warning:', authErr);
      }

      // 2. Update DB user role to 'archived'
      await supabaseAdmin.from('users').update({ role: 'archived', active_role: 'archived' }).eq('id', userId);

      return NextResponse.json({ success: true, message: 'User account has been archived.' });
    }

    // 5. RESTORE ARCHIVED USER
    if (action === 'restore') {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const previousRole = authUser?.user?.user_metadata?.previous_role || 'student';

      // 1. Unban & update metadata in Auth
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
        user_metadata: { is_deleted: false, deleted_at: null },
      });
      if (authErr) {
        return NextResponse.json({ error: authErr.message }, { status: 500 });
      }

      // 2. Restore DB user role via RPC
      await supabaseAdmin.rpc('admin_set_user_role', { p_user_id: userId, p_role: previousRole });

      return NextResponse.json({ success: true, message: `User account restored to ${previousRole}.` });
    }

    // 6. PERMANENT PURGE (HARD DELETE)
    if (action === 'purge') {
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authErr) console.warn('Auth purge warning:', authErr);
      const { error: dbErr } = await supabaseAdmin.from('users').delete().eq('id', userId);
      if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
      return NextResponse.json({ success: true, message: 'User account permanently purged.' });
    }

    // 7. RESET PASSWORD
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

    // 8. SEND DIRECT NOTIFICATION
    if (action === 'send_notification') {
      if (!title || !message) {
        return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
      }
      const { error } = await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        title,
        body: message,
        type: 'application_update',
        is_read: false,
        created_at: new Date().toISOString(),
      });
      if (error) {
        console.error('Notification insert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Notification sent to user.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in /api/admin/users/action:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
