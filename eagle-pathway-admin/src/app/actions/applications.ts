'use server'
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

async function verifyAdmin(adminToken: string) {
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(adminToken);
  if (authError || !user) throw new Error("Unauthorized");
  
  const { data: adminUser } = await supabaseAdmin
    .from('users')
    .select('active_role')
    .eq('id', user.id)
    .single();
    
  if (adminUser?.active_role !== 'admin' && adminUser?.active_role !== 'tutor') {
    throw new Error("Forbidden: Admin or Tutor access required");
  }
}

export async function updateApplicationStatus(appId: string, status: string, adminToken: string) {
  await verifyAdmin(adminToken);

  const { error } = await supabaseAdmin
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', appId);

  if (error) throw new Error(error.message);
  revalidatePath('/applications');
  return { success: true };
}

export async function assignConsultant(appId: string, consultantId: string, adminToken: string) {
  await verifyAdmin(adminToken);

  const { error } = await supabaseAdmin
    .from('applications')
    .update({ consultant_id: consultantId })
    .eq('id', appId);

  if (error) throw new Error(error.message);
  revalidatePath('/applications');
  return { success: true };
}

export async function saveApplicationNotes(appId: string, notes: string, adminToken: string) {
  await verifyAdmin(adminToken);

  const { error } = await supabaseAdmin
    .from('applications')
    .update({ notes })
    .eq('id', appId);

  if (error) throw new Error(error.message);
  revalidatePath('/applications');
  return { success: true };
}

export async function saveApplicationFeedback(
  appId: string, 
  feedback: string, 
  studentId: string, 
  scholarshipName: string | undefined,
  adminToken: string
) {
  await verifyAdmin(adminToken);

  const { error } = await supabaseAdmin
    .from('applications')
    .update({ consultant_feedback: feedback, updated_at: new Date().toISOString() })
    .eq('id', appId);

  if (error) throw new Error(error.message);

  if (studentId) {
    await supabaseAdmin.from('notifications').insert({
      user_id: studentId,
      type: 'sop_reviewed',
      title: 'SOP Feedback Available',
      body: `Consultant left some feedback on your ${scholarshipName || 'scholarship'} application.`,
    });
  }

  revalidatePath('/applications');
  return { success: true };
}
