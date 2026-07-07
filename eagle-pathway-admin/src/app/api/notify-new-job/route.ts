import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthenticatedUser } from '../sop-review/route';

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

export async function POST(req: Request) {
  try {
    const user = await requireAuthenticatedUser(req);
    const { job_post_id } = await req.json();
    if (!job_post_id) {
      return NextResponse.json({ error: 'job_post_id is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Get the job post
    const { data: job, error: jobError } = await supabase
      .from('tutor_job_posts')
      .select('*')
      .eq('id', job_post_id)
      .single();
    if (jobError || !job) {
      return NextResponse.json({ error: 'Job post not found' }, { status: 404 });
    }
    if (job.notification_sent) {
      return NextResponse.json({ message: 'Notifications already sent' });
    }

    // 2. Get approved tutors' push tokens
    const { data: tokens, error: tokensError } = await supabase.rpc('get_approved_tutor_push_tokens');
    if (tokensError) {
      console.error('Failed to fetch push tokens:', tokensError);
    }

    const pushTokens = (tokens as { token: string; user_id: string }[] | null) || [];

    // 3. Insert in-app notifications for all approved tutors
    const inAppNotifs = pushTokens.map(t => ({
      user_id: t.user_id,
      type: 'tutor_job_alert' as const,
      title: 'New Tutor Job Available',
      body: `A new job for ${job.grade} — ${job.subjects?.[0] || 'tutoring'} just posted. Tap to view.`,
      data: { url: '/tutor-jobs', job_post_id: job.id },
      is_read: false,
    }));

    if (inAppNotifs.length > 0) {
      const { error: notifError } = await supabase.from('notifications').insert(inAppNotifs);
      if (notifError) console.error('Failed to insert in-app notifications:', notifError);
    }

    // 4. Send Expo push notifications
    const expoMessages = pushTokens
      .filter(t => t.token.startsWith('ExponentPushToken') || t.token.startsWith('ExpoPushToken'))
      .map(t => ({
        to: t.token,
        sound: 'default',
        title: 'New Tutor Job Available',
        body: `A new job for ${job.grade} — ${job.subjects?.[0] || 'tutoring'} just posted. Tap to view.`,
        data: { url: '/tutor-jobs', job_post_id: job.id },
      }));

    if (expoMessages.length > 0) {
      try {
        const pushResponse = await fetch(EXPO_PUSH_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expoMessages),
        });
        const pushResult = await pushResponse.json();
        if (!pushResponse.ok) {
          console.error('Expo push API error:', pushResult);
        }
      } catch (pushError) {
        console.error('Failed to send Expo push:', pushError);
      }
    }

    // 5. Mark notifications sent
    await supabase
      .from('tutor_job_posts')
      .update({ notification_sent: true })
      .eq('id', job_post_id);

    return NextResponse.json({
      success: true,
      notified_count: pushTokens.length,
    });
  } catch (e: any) {
    console.error('Notify new job error:', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: e.message?.includes('Authentication') ? 401 : 500 },
    );
  }
}
