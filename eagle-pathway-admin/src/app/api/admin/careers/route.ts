import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, getStrictAdminClient } from '@/lib/adminAuthGuard';

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'job-opening';
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) {
      return authResult.errorResponse!;
    }

    const supabaseAdmin = getStrictAdminClient();

    // 1. Fetch all careers
    const { data: careers, error: careersErr } = await supabaseAdmin
      .from('careers')
      .select('*')
      .order('created_at', { ascending: false });

    if (careersErr) {
      return NextResponse.json({ error: careersErr.message }, { status: 500 });
    }

    // 2. Fetch application counts per career
    const { data: appCounts, error: countErr } = await supabaseAdmin
      .from('job_applications')
      .select('career_id');

    const countsMap = new Map<string, number>();
    if (!countErr && appCounts) {
      for (const app of appCounts) {
        if (app.career_id) {
          countsMap.set(app.career_id, (countsMap.get(app.career_id) || 0) + 1);
        }
      }
    }

    const formatted = (careers || []).map((c: any) => ({
      ...c,
      responsibilities: Array.isArray(c.responsibilities) ? c.responsibilities : [],
      requirements: Array.isArray(c.requirements) ? c.requirements : [],
      benefits: Array.isArray(c.benefits) ? c.benefits : [],
      applications_count: countsMap.get(c.id) || 0,
    }));

    return NextResponse.json({ careers: formatted });
  } catch (err: any) {
    console.error('GET /api/admin/careers error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) {
      return authResult.errorResponse!;
    }

    const body = await req.json();
    const {
      title,
      department,
      location = 'Addis Ababa / Hybrid',
      employment_type = 'Full-time',
      experience_level = 'Mid-Level',
      salary_range,
      deadline = 'Rolling',
      summary,
      description,
      responsibilities = [],
      requirements = [],
      benefits = [],
      is_active = true,
      featured = false,
    } = body;

    if (!title?.trim() || !department?.trim() || !summary?.trim()) {
      return NextResponse.json(
        { error: 'Title, Department, and Summary are required.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getStrictAdminClient();

    // Check slug collisions
    let slug = generateSlug(title);
    const { data: existingSlug } = await supabaseAdmin
      .from('careers')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const payload = {
      title: title.trim(),
      slug,
      department: department.trim(),
      location: location.trim(),
      employment_type,
      experience_level,
      salary_range: salary_range?.trim() || null,
      deadline: deadline?.trim() || 'Rolling',
      summary: summary.trim(),
      description: description?.trim() || null,
      responsibilities: Array.isArray(responsibilities) ? responsibilities.filter(Boolean) : [],
      requirements: Array.isArray(requirements) ? requirements.filter(Boolean) : [],
      benefits: Array.isArray(benefits) ? benefits.filter(Boolean) : [],
      is_active: Boolean(is_active),
      featured: Boolean(featured),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: career, error: insertErr } = await supabaseAdmin
      .from('careers')
      .insert(payload)
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ career: { ...career, applications_count: 0 } }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/admin/careers error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

