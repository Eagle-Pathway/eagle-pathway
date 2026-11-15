import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, getStrictAdminClient } from '@/lib/adminAuthGuard';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) {
      return authResult.errorResponse!;
    }

    const { searchParams } = new URL(req.url);
    const careerId = searchParams.get('career_id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const supabaseAdmin = getStrictAdminClient();

    let query = supabaseAdmin
      .from('job_applications')
      .select('*, career:careers(id, title, department)')
      .order('created_at', { ascending: false });

    if (careerId && careerId !== 'all') {
      const { data: career } = await supabaseAdmin
        .from('careers')
        .select('id, title')
        .eq('id', careerId)
        .maybeSingle();

      if (career?.title) {
        // Auto-heal: Link unlinked applications to this career based on title
        await supabaseAdmin
          .from('job_applications')
          .update({ career_id: careerId })
          .is('career_id', null)
          .ilike('job_title', career.title.trim());

        const { data: unlinked } = await supabaseAdmin
          .from('job_applications')
          .select('id, job_title')
          .is('career_id', null);

        if (unlinked && unlinked.length > 0) {
          const lowerCareerTitle = career.title.toLowerCase().trim();
          const toLinkIds = unlinked
            .filter((u: any) => {
              if (!u.job_title) return false;
              const appTitle = u.job_title.toLowerCase().trim();
              return (
                appTitle === lowerCareerTitle ||
                lowerCareerTitle.includes(appTitle) ||
                appTitle.includes(lowerCareerTitle)
              );
            })
            .map((u: any) => u.id);

          if (toLinkIds.length > 0) {
            await supabaseAdmin
              .from('job_applications')
              .update({ career_id: careerId })
              .in('id', toLinkIds);
          }
        }
      }

      query = query.eq('career_id', careerId);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`full_name.ilike.${term},email.ilike.${term},phone.ilike.${term},job_title.ilike.${term}`);
    }

    const { data: applications, error: appErr } = await query;

    if (appErr) {
      return NextResponse.json({ error: appErr.message }, { status: 500 });
    }

    // Compute global application metrics safely via service role
    const { data: allApps } = await supabaseAdmin
      .from('job_applications')
      .select('status');

    const stats = {
      total: allApps?.length || 0,
      pending: allApps?.filter((a: any) => a.status === 'pending').length || 0,
      reviewing: allApps?.filter((a: any) => a.status === 'reviewing' || a.status === 'interviewed').length || 0,
      offered: allApps?.filter((a: any) => a.status === 'offered').length || 0,
    };

    return NextResponse.json({
      applications: applications || [],
      stats,
    });
  } catch (err: any) {
    console.error('GET /api/admin/careers/applications error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

