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

    return NextResponse.json({ applications: applications || [] });
  } catch (err: any) {
    console.error('GET /api/admin/careers/applications error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

