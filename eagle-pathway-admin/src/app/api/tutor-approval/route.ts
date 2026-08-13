import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTutorApprovalEmail, sendTutorRejectionEmail } from '@/lib/resend';

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request) {
  try {
    const { userId, isVerified, userUpdates, reason } = await request.json();

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

    const updatePayload: Record<string, any> = {
      status: isVerified ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
    };
    if (!isVerified && reason) {
      updatePayload.rejection_reason = reason;
    }

    await serviceClient
      .from('tutor_applications')
      .update(updatePayload)
      .eq('tutor_id', userId);

    const finalUserUpdates = {
      ...(userUpdates || {}),
      is_verified: isVerified,
    };

    await serviceClient
      .from('users')
      .update(finalUserUpdates)
      .eq('id', userId);

    const notif = isVerified
      ? {
          user_id: userId,
          title: "Verification Approved! 🎉",
          body: 'Your tutor profile is now verified and live on Eagle Pathway. You can now apply for open tutoring jobs!',
          type: 'application_update',
          is_read: false,
        }
      : {
          user_id: userId,
          title: 'Verification Status Revoked ⚠️',
          body: reason ? `Your tutor verification was not approved. Reason: ${reason}` : 'Your tutor verification status has been revoked by an administrator. You can no longer apply for open jobs.',
          type: 'application_update',
          is_read: false,
        };

    try {
      await serviceClient.from('notifications').insert(notif);
    } catch {
      // Non-critical notification error
    }

    // Dispatch Resend Email Notification
    try {
      const { data: userProfile } = await serviceClient
        .from('users')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      if (userProfile?.email) {
        if (isVerified) {
          await sendTutorApprovalEmail({
            to: userProfile.email,
            fullName: userProfile.full_name || 'Tutor',
          });
        } else {
          await sendTutorRejectionEmail({
            to: userProfile.email,
            fullName: userProfile.full_name || 'Applicant',
            reason,
          });
        }
      }
    } catch (emailErr) {
      console.error('[TutorApproval] Non-fatal email dispatch error:', emailErr);
    }

    return NextResponse.json({ success: true, isVerified });
  } catch (err: any) {
    console.error('Tutor approval API exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
