import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

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

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    // 2. Insert the pending payment record
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: params.userId,
        reference_id: params.referenceId,
        payment_type: params.paymentType,
        method: params.method,
        amount: params.amount,
        transaction_id: params.transactionId,
        receipt_url: publicUrl,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw new Error('Failed to submit payment record. ' + error.message);
    
    return data;
  }
};
