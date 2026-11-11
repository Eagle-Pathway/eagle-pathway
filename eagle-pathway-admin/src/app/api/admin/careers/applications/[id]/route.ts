import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, getStrictAdminClient } from '@/lib/adminAuthGuard';

export async function PATCH(
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
      return NextResponse.json({ error: 'Application ID is required.' }, { status: 400 });
    }

    const body = await req.json();
    const { status, notes } = body;

    const validStatuses = ['pending', 'reviewing', 'interviewed', 'offered', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const supabaseAdmin = getStrictAdminClient();

    const updateData: Record<string, any> = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('job_applications')
      .update(updateData)
      .eq('id', id)
      .select('*, career:careers(id, title, department)')
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ application: updated });
  } catch (err: any) {
    console.error('PATCH /api/admin/careers/applications/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

