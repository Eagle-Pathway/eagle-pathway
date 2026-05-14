'use server';

import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

/**
 * Helper to verify that the user associated with the accessToken has the 'admin' role.
 */
async function verifyAdmin(accessToken: string) {
  if (!accessToken) throw new Error('Unauthorized: No access token provided.');

  // Use a standard client to verify the user's token
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) throw new Error('Unauthorized: Invalid session.');

  // Check the database for the admin role
  const adminClient = getSupabaseAdmin();
  const { data: profile, error: profileError } = await adminClient
    .from('users')
    .select('roles, active_role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) throw new Error('Unauthorized: User profile not found.');

  const isAdmin = profile.active_role === 'admin' || profile.roles?.includes('admin');
  if (!isAdmin) throw new Error('Unauthorized: Admin access required.');

  return user;
}

/**
 * ACTION: Update tutor verification status
 */
export async function toggleTutorVerification(accessToken: string, userId: string, verified: boolean) {
  const adminUser = await verifyAdmin(accessToken);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('tutors')
    .update({ is_verified: verified })
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to update tutor: ${error.message}`);

  // Send notification
  const notification = verified
    ? {
        user_id: userId,
        title: "You've been approved! 🎉",
        body: 'Your tutor profile is now live on Eagle Pathway. Students can now find and book you.',
        type: 'application_update',
        is_read: false,
      }
    : {
        user_id: userId,
        title: 'Account Status Update',
        body: 'Your tutor verification has been revoked by an administrator. Please contact support for more information.',
        type: 'application_update',
        is_read: false,
      };

  await supabase.from('notifications').insert(notification);

  return { success: true };
}

/**
 * ACTION: Update document verification status
 */
export async function updateDocumentStatus(
  accessToken: string, 
  docId: string, 
  status: 'approved' | 'rejected', 
  notes?: string
) {
  const adminUser = await verifyAdmin(accessToken);
  const supabase = getSupabaseAdmin();

  // 1. Get document to find user_id and type
  const { data: doc } = await supabase
    .from('documents')
    .select('user_id, document_type')
    .eq('id', docId)
    .single();

  if (!doc) throw new Error('Document not found.');

  // 2. Update status
  const { error } = await supabase
    .from('documents')
    .update({ 
      status, 
      reviewer_notes: status === 'rejected' ? notes : null 
    })
    .eq('id', docId);

  if (error) throw new Error(`Failed to update document: ${error.message}`);

  // 3. Send notification
  const typeStr = doc.document_type.replaceAll('_', ' ');
  await supabase.from('notifications').insert({
    user_id: doc.user_id,
    type: status === 'approved' ? 'document_approved' : 'document_rejected',
    title: status === 'approved' ? 'Document Approved 🟢' : 'Document Rejected 🔴',
    body: status === 'approved' 
      ? `Your ${typeStr} has been verified.` 
      : `Your ${typeStr} was rejected. Reason: ${notes || 'Please upload a clearer copy.'}`,
  });

  return { success: true };
}

/**
 * ACTION: Complete a tutor payout request
 */
export async function completePayoutRequest(
  accessToken: string,
  requestId: string
) {
  const adminUser = await verifyAdmin(accessToken);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('tutor_payouts')
    .update({ 
      status: 'completed', 
      processed_at: new Date().toISOString() 
    })
    .eq('id', requestId);

  if (error) throw new Error(`Failed to complete payout: ${error.message}`);

  return { success: true };
}

/**
 * ACTION: Verify payment receipt
 */
export async function verifyPaymentReceipt(
  accessToken: string,
  paymentId: string,
  status: 'approved' | 'rejected'
) {
  const adminUser = await verifyAdmin(accessToken);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('payments')
    .update({
      status,
      admin_notes: status === 'rejected' ? 'Invalid receipt. Please try again.' : null,
      reviewed_by: adminUser.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', paymentId);

  if (error) throw new Error(`Failed to verify receipt: ${error.message}`);

  return { success: true };
}
