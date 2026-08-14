import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

export const paymentsService = {
  async submitPaymentReceipt(params: {
    userId: string;
    referenceId?: string; // booking_id or application_id
    paymentType: 'scholarship_package' | 'tutor_booking';
    method: 'telebirr' | 'cbe';
    amount: number;
    transactionId: string;
    fileUri: string;
    fileName: string;
  }) {
    // 1. Upload the receipt screenshot to the 'receipts' bucket
    const fileExt = params.fileName.split('.').pop();
    const filePath = `${params.userId}/${Date.now()}.${fileExt}`;
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(params.fileUri, { encoding: 'base64' });
    
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, decode(base64), {
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        upsert: true
      });

    if (uploadError) throw new Error('Failed to upload receipt image. ' + uploadError.message);

    const { data: signedData, error: signedError } = await supabase.storage
      .from('receipts')
      .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);

    if (signedError) throw new Error('Failed to secure receipt preview. ' + signedError.message);

    // 2. Insert the payment record
    const { data: paymentRecord, error } = await supabase
      .from('payments')
      .insert({
        user_id: params.userId,
        reference_id: params.referenceId,
        payment_type: params.paymentType,
        method: params.method,
        amount: params.amount,
        transaction_id: params.transactionId,
        receipt_path: filePath,
        receipt_url: signedData.signedUrl,
        status: 'pending',
        verification_status: 'pending_verification'
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('unique_provider_reference') || error.code === '23505') {
        throw new Error('This transaction reference ID has already been redeemed on Eagle Pathway.');
      }
      throw new Error(`Failed to submit payment record. ${error.message}`);
    }

    // 3. Invoke Server-Side Supabase Edge Function to Verify against Bank Source of Truth
    try {
      const { data: verificationResult, error: funcError } = await supabase.functions.invoke('verify-payment', {
        body: {
          payment_id: paymentRecord.id,
          user_id: params.userId,
          method: params.method,
          transaction_id: params.transactionId,
          amount: params.amount,
        }
      });

      if (!funcError && verificationResult) {
        return {
          payment: paymentRecord,
          verification: verificationResult as {
            status: 'verified' | 'manual_review' | 'rejected';
            reason: string;
            bankRecord?: any;
          }
        };
      }
    } catch (e) {
      console.warn('Edge function verification call fallback:', e);
    }
    
    return {
      payment: paymentRecord,
      verification: {
        status: 'manual_review' as const,
        reason: 'Receipt submitted successfully. Queued for fast admin verification.'
      }
    };
  }
};
