import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, getStrictAdminClient } from '@/lib/adminAuthGuard';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) {
      return authResult.errorResponse!;
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Career ID is required.' }, { status: 400 });
    }

    const body = await req.json();
    const supabaseAdmin = getStrictAdminClient();

    // Partial update or full update support
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.department !== undefined) updateData.department = body.department.trim();
    if (body.location !== undefined) updateData.location = body.location.trim();
    if (body.employment_type !== undefined) updateData.employment_type = body.employment_type;
    if (body.experience_level !== undefined) updateData.experience_level = body.experience_level;
    if (body.salary_range !== undefined) updateData.salary_range = body.salary_range?.trim() || null;
    if (body.deadline !== undefined) updateData.deadline = body.deadline?.trim() || 'Rolling';
    if (body.summary !== undefined) updateData.summary = body.summary.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.responsibilities !== undefined) {
      updateData.responsibilities = Array.isArray(body.responsibilities)
        ? body.responsibilities.filter(Boolean)
        : [];
    }
    if (body.requirements !== undefined) {
      updateData.requirements = Array.isArray(body.requirements)
        ? body.requirements.filter(Boolean)
        : [];
    }
    if (body.benefits !== undefined) {
      updateData.benefits = Array.isArray(body.benefits) ? body.benefits.filter(Boolean) : [];
    }
    if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active);
    if (body.featured !== undefined) updateData.featured = Boolean(body.featured);

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('careers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ career: updated });
  } catch (err: any) {
    console.error('PUT /api/admin/careers/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) {
      return authResult.errorResponse!;
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Career ID is required.' }, { status: 400 });
    }

    const supabaseAdmin = getStrictAdminClient();

    const { error: deleteErr } = await supabaseAdmin
      .from('careers')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/admin/careers/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

