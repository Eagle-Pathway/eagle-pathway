'use server'
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function updateDocumentStatus(
  docId: string, 
  status: 'approved' | 'rejected', 
  reviewerNotes: string | null,
  userId: string | undefined,
  documentType: string | undefined,
  adminToken: string
) {
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(adminToken);
  if (authError || !user) throw new Error("Unauthorized");
  
  const { data: adminUser } = await supabaseAdmin
    .from('users')
    .select('active_role')
    .eq('id', user.id)
    .single();
    
  if (adminUser?.active_role !== 'admin') {
    throw new Error("Forbidden: Admin access required");
  }

  const { error } = await supabaseAdmin
    .from('documents')
    .update({ status, reviewer_notes: status === 'rejected' ? reviewerNotes : null })
    .eq('id', docId);

  if (error) throw new Error(error.message);

  if (userId) {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type: status === 'approved' ? 'document_approved' : 'document_rejected',
      title: status === 'approved' ? 'Document Approved 🟢' : 'Document Rejected 🔴',
      body: status === 'approved' 
        ? `Your ${(documentType || 'document').replace('_',' ')} has been verified.` 
        : `Your ${(documentType || 'document').replace('_',' ')} was rejected. Reason: ${reviewerNotes || 'Please upload a clearer copy.'}`,
    });
  }

  revalidatePath('/documents');
  return { success: true };
}
