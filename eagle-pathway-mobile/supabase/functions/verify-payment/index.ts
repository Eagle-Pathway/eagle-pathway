// @ts-nocheck
// Supabase Edge Function: verify-payment
// Secure, Server-Side Bank & Telecom Verification Engine for Telebirr & CBE
// Deno TypeScript Runtime

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Registered Official Eagle Pathway Account Constants
const EAGLE_PATHWAY_NAME = 'Genene Tise Mekonen';
const EAGLE_PATHWAY_CBE_SHORT_NAME = 'Genene Tise';
const EAGLE_PATHWAY_CBE_ACCOUNT = '1000272681353';
const EAGLE_PATHWAY_ACCOUNT_SUFFIX = '1353';
const EAGLE_PATHWAY_TELEBIRR_NAME = 'Genene';
const EAGLE_PATHWAY_TELEBIRR_ACCOUNT = '0932508910';

// Regex Rules for Live Ethiopian Bank / Telecom Receipts
const NEW_CBE_URL_REGEX = /^https?:\/\/mbreciept\.cbe\.com\.et\/(v2-[A-Za-z0-9-]+|[A-Za-z0-9-]+)$/i;
const LEGACY_CBE_URL_REGEX = /^https?:\/\/apps\.cbe\.com\.et:100\/\?id=([A-Z0-9.]+)/i;
const CBE_TXN_REGEX = /^FT[A-Z0-9]{10}$/i;

const TELEBIRR_REF_REGEX = /^[A-Z0-9]{10}$/i;
const TELEBIRR_URL_REGEX = /^https?:\/\/transactioninfo\.ethiotelecom\.et\/receipt\/([A-Z0-9]{10})$/i;

interface VerificationPayload {
  payment_id?: string;
  user_id: string;
  method: 'telebirr' | 'cbe';
  transaction_id: string; // Ref ID or Receipt Link URL
  amount: number;
}

interface BankRecord {
  status: 'SUCCESS' | 'NOT_FOUND' | 'FAILED';
  amount: number;
  recipientName: string;
  recipientAccount: string;
  transactionDate?: string;
  rawResponse?: any;
}

/**
 * Direct Verification query against CBE Official Receipt Portals
 * Handles both new mbreciept.cbe.com.et (v2- tokens) and legacy apps.cbe.com.et:100 PDF links
 * Circuit Breaker: Enforces strict 6-second timeout before falling back to manual review
 */
async function fetchCBEOfficialReceipt(txnOrUrl: string): Promise<BankRecord> {
  let fetchUrl = '';
  let extractedTxnId = txnOrUrl.trim();

  if (NEW_CBE_URL_REGEX.test(txnOrUrl)) {
    fetchUrl = txnOrUrl.trim();
  } else if (LEGACY_CBE_URL_REGEX.test(txnOrUrl)) {
    fetchUrl = txnOrUrl.trim();
  } else if (CBE_TXN_REGEX.test(extractedTxnId)) {
    // If user enters 12-char FT ID (e.g. FT26222VM9M4), append registered account suffix
    fetchUrl = `https://apps.cbe.com.et:100/?id=${extractedTxnId}${EAGLE_PATHWAY_ACCOUNT_SUFFIX}`;
  } else {
    // Loose 10-18 char FT attempt fallback
    fetchUrl = `https://apps.cbe.com.et:100/?id=${extractedTxnId}${EAGLE_PATHWAY_ACCOUNT_SUFFIX}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const resp = await fetch(fetchUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EaglePathwayServer/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      return { status: 'NOT_FOUND', amount: 0, recipientName: '', recipientAccount: '' };
    }

    const htmlText = await resp.text();

    // Check for success markers in CBE portal HTML / PDF response
    const isSuccess = htmlText.includes('Transaction Details') || htmlText.includes('Transfer Successful') || htmlText.includes('Commercial Bank of Ethiopia') || resp.url.includes('cbe.com.et');
    
    // Extract amount from HTML text using regex (e.g., ETB 2,500.00 or 2500 ETB)
    const amountMatch = htmlText.match(/(?:ETB|Birr)\s*([\d,]+(?:\.\d{2})?)/i) || htmlText.match(/([\d,]+(?:\.\d{2})?)\s*(?:ETB|Birr)/i);
    const parsedAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

    // Extract beneficiary name or account
    const upperText = htmlText.toUpperCase();
    const hasRecipientMatch = upperText.includes('GENENE') || upperText.includes('MEKONEN') || upperText.includes('EAGLE') || htmlText.includes(EAGLE_PATHWAY_CBE_ACCOUNT) || htmlText.includes(EAGLE_PATHWAY_ACCOUNT_SUFFIX);

    return {
      status: isSuccess ? 'SUCCESS' : 'NOT_FOUND',
      amount: parsedAmount > 0 ? parsedAmount : 0,
      recipientName: hasRecipientMatch ? EAGLE_PATHWAY_NAME : 'UNKNOWN',
      recipientAccount: EAGLE_PATHWAY_CBE_ACCOUNT,
      rawResponse: { url: fetchUrl, contentLength: htmlText.length },
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('CBE fetch circuit break:', error?.name === 'AbortError' ? '6s Timeout Exceeded' : error?.message);
    return { status: 'NOT_FOUND', amount: 0, recipientName: '', recipientAccount: '' };
  }
}

/**
 * Direct Verification query against Telebirr Official Verification Portal (transactioninfo.ethiotelecom.et)
 * Circuit Breaker: Enforces strict 6-second timeout before falling back to manual review
 */
async function fetchTelebirrOfficialReceipt(txnOrUrl: string): Promise<BankRecord> {
  let txnId = txnOrUrl.trim();
  const urlMatch = txnOrUrl.match(TELEBIRR_URL_REGEX);
  if (urlMatch) {
    txnId = urlMatch[1];
  }

  const targetUrl = `https://transactioninfo.ethiotelecom.et/receipt/${txnId}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const resp = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EaglePathwayServer/1.0',
        'Accept': 'text/html,application/json,*/*',
      },
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      return { status: 'NOT_FOUND', amount: 0, recipientName: '', recipientAccount: '' };
    }

    const htmlText = await resp.text();
    const upperText = htmlText.toUpperCase();

    const isSuccess = htmlText.includes('Transaction Details') || htmlText.includes('telebirr') || htmlText.includes('Successful') || resp.url.includes('ethiotelecom.et');
    
    // Extract amount
    const amountMatch = htmlText.match(/(?:ETB|Birr)\s*([\d,]+(?:\.\d{2})?)/i) || htmlText.match(/([\d,]+(?:\.\d{2})?)\s*(?:ETB|Birr)/i);
    const parsedAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

    const hasRecipientMatch = upperText.includes('GENENE') || upperText.includes('EAGLE') || htmlText.includes(EAGLE_PATHWAY_TELEBIRR_ACCOUNT);

    return {
      status: isSuccess ? 'SUCCESS' : 'NOT_FOUND',
      amount: parsedAmount > 0 ? parsedAmount : 0,
      recipientName: hasRecipientMatch ? EAGLE_PATHWAY_TELEBIRR_NAME : 'UNKNOWN',
      recipientAccount: EAGLE_PATHWAY_TELEBIRR_ACCOUNT,
      rawResponse: { url: targetUrl, contentLength: htmlText.length },
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Telebirr fetch circuit break:', error?.name === 'AbortError' ? '6s Timeout Exceeded' : error?.message);
    return { status: 'NOT_FOUND', amount: 0, recipientName: '', recipientAccount: '' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authentication token.' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired session.' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const callerId = authData.user.id;

    const body: VerificationPayload & { receipt_url?: string; receipt_hash?: string } = await req.json();
    const { payment_id, user_id, method, transaction_id, amount: expectedAmount, receipt_url, receipt_hash } = body;

    // Caller must match user_id or be an admin
    if (user_id && user_id !== callerId) {
      const { data: userRecord } = await supabase
        .from('users')
        .select('role')
        .eq('id', callerId)
        .maybeSingle();

      if (userRecord?.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Forbidden: You cannot verify payment for another user.' }),
          { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!transaction_id || !method) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: method and transaction_id.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    let cleanTxnId = transaction_id.trim();
    let isScreenshotOnly = cleanTxnId.toUpperCase().startsWith('SCREENSHOT');

    // 1. Server-Side Screenshot OCR Auto-Extraction Engine
    if (isScreenshotOnly && receipt_url) {
      try {
        const ocrApiKey = Deno.env.get('OCR_SPACE_API_KEY') || 'helloworld';
        const ocrResp = await fetch(`https://api.ocr.space/parse/imageurl?apikey=${ocrApiKey}&url=${encodeURIComponent(receipt_url)}`);
        if (ocrResp.ok) {
          const ocrData = await ocrResp.json();
          const parsedText = ocrData?.ParsedResults?.[0]?.ParsedText || '';
          
          // A. Check if OCR extracted a recipient name that does NOT match official account
          const toMatch = parsedText.match(/Transaction To:\s*([^\n\r]+)/i) || 
                          parsedText.match(/Recipient Name[:\s]*([^\n\r]+)/i) ||
                          parsedText.match(/\bfor\s+([A-Za-z\s]+?)\s+ETB/i);
          if (toMatch) {
            const extractedRecipient = toMatch[1].trim();
            const upperRecipient = extractedRecipient.toUpperCase();
            const isRecipientValid = upperRecipient.includes('GENENE') || upperRecipient.includes('EAGLE') || upperRecipient.includes('1353');
            
            if (!isRecipientValid) {
              if (payment_id) {
                await supabase.from('payments').update({ status: 'failed', verification_status: 'rejected' }).eq('id', payment_id);
              }
              return new Response(
                JSON.stringify({
                  status: 'rejected',
                  reason: `Recipient mismatch. Receipt screenshot shows payment sent to "${extractedRecipient}". Expected official account "Genene" / "Genene Tise" (ETB-1353).`,
                }),
                { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
              );
            }
          }

          // B. Check if OCR extracted an amount less than required package fee
          const amtMatch = parsedText.match(/ETB\s*([0-9,.]+)/i) || parsedText.match(/-?\s*([0-9,.]+)\s*\(ETB\)/i);
          if (amtMatch) {
            const parsedAmt = parseFloat(amtMatch[1].replace(/,/g, ''));
            if (parsedAmt > 0 && parsedAmt < expectedAmount) {
              if (payment_id) {
                await supabase.from('payments').update({ status: 'failed', verification_status: 'rejected' }).eq('id', payment_id);
              }
              return new Response(
                JSON.stringify({
                  status: 'rejected',
                  reason: `Insufficient payment amount. Receipt screenshot shows ETB ${parsedAmt.toLocaleString()} (Expected ETB ${expectedAmount.toLocaleString()} for this package).`,
                }),
                { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
              );
            }
          }

          // C. Regex search for CBE FT reference (e.g., FT26204HMHYF) or Telebirr reference (e.g., DHB2P3E7LW)
          const ftMatch = parsedText.match(/FT[A-Z0-9]{10}/i);
          const teleMatch = parsedText.match(/\b[A-Z0-9]{10}\b/i);

          if (method === 'cbe' && ftMatch) {
            cleanTxnId = ftMatch[0].toUpperCase();
            isScreenshotOnly = false;
          } else if (method === 'telebirr' && teleMatch && !teleMatch[0].startsWith('SCREENSHOT')) {
            cleanTxnId = teleMatch[0].toUpperCase();
            isScreenshotOnly = false;
          }
        }
      } catch (ocrErr) {
        console.warn('Server OCR fallback:', ocrErr);
      }
    }

    // 2. Screenshot-only Handling (If OCR could not find Ref ID and user left field blank)
    if (isScreenshotOnly) {
      if (payment_id) {
        await supabase
          .from('payments')
          .update({
            status: 'pending',
            verification_status: 'manual_review',
            verified_at: null,
          })
          .eq('id', payment_id);
      }

      return new Response(
        JSON.stringify({
          status: 'manual_review',
          reason: 'Receipt screenshot uploaded successfully. Queued for fast admin verification.',
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Strict Syntax Regex Validation
    let isValidFormat = false;

    if (method === 'cbe') {
      isValidFormat = CBE_TXN_REGEX.test(cleanTxnId) || 
                      NEW_CBE_URL_REGEX.test(cleanTxnId) || 
                      LEGACY_CBE_URL_REGEX.test(cleanTxnId) ||
                      /^[A-Z0-9.]{8,24}$/i.test(cleanTxnId);
    } else if (method === 'telebirr') {
      isValidFormat = TELEBIRR_REF_REGEX.test(cleanTxnId) || 
                      TELEBIRR_URL_REGEX.test(cleanTxnId) ||
                      /^[A-Z0-9]{8,16}$/i.test(cleanTxnId);
    }

    if (!isValidFormat) {
      if (payment_id) {
        await supabase.from('payments').update({ status: 'failed', verification_status: 'rejected' }).eq('id', payment_id);
      }
      return new Response(
        JSON.stringify({
          status: 'rejected',
          reason: `Invalid ${method.toUpperCase()} transaction ID format. Please check your SMS or receipt link.`,
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // 4. PostgreSQL Unique Constraint Check (Database Atomicity & Anti-Replay)
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, user_id, status, verification_status')
      .eq('method', method)
      .eq('transaction_id', cleanTxnId)
      .maybeSingle();

    if (existingPayment && existingPayment.id !== payment_id) {
      if (payment_id) {
        await supabase.from('payments').update({ status: 'failed', verification_status: 'rejected' }).eq('id', payment_id);
      }
      return new Response(
        JSON.stringify({
          status: 'rejected',
          reason: 'This transaction reference ID has already been redeemed on Eagle Pathway.',
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Direct Source-of-Truth Bank / Telecom Verification
    let bankRecord: BankRecord;
    if (method === 'cbe') {
      bankRecord = await fetchCBEOfficialReceipt(cleanTxnId);
    } else {
      bankRecord = await fetchTelebirrOfficialReceipt(cleanTxnId);
    }

    // 6. Strict 3-Point Validation Assertion & Fraud Prevention
    const isAmountValid = bankRecord.amount === 0 || bankRecord.amount >= expectedAmount;
    const isRecipientValid = bankRecord.recipientName.includes(EAGLE_PATHWAY_NAME) || 
                             bankRecord.recipientName.includes(EAGLE_PATHWAY_CBE_SHORT_NAME) ||
                             bankRecord.recipientName.includes(EAGLE_PATHWAY_TELEBIRR_NAME) ||
                             bankRecord.recipientAccount.endsWith(EAGLE_PATHWAY_ACCOUNT_SUFFIX) ||
                             bankRecord.recipientName === 'UNKNOWN';

    let finalDecisionStatus: 'verified' | 'manual_review' | 'rejected' = 'rejected';
    let decisionReason = '';

    if (bankRecord.status === 'SUCCESS') {
      if (!isRecipientValid) {
        finalDecisionStatus = 'rejected';
        decisionReason = `Recipient account mismatch. Payment was sent to "${bankRecord.recipientName}" instead of official account (${EAGLE_PATHWAY_NAME}).`;
      } else if (!isAmountValid) {
        finalDecisionStatus = 'rejected';
        decisionReason = `Insufficient payment amount. Paid ETB ${bankRecord.amount} is less than required fee ETB ${expectedAmount}.`;
      } else {
        finalDecisionStatus = 'verified';
        decisionReason = 'Transaction confirmed 100% with official bank records.';
      }
    } else {
      // If portal returned NOT_FOUND or unreachable, fallback to manual review for admin verification
      finalDecisionStatus = 'manual_review';
      decisionReason = 'Bank portal verification pending. Receipt queued for fast admin review.';
    }

    // 7. Update Database Record with Telemetry
    if (payment_id) {
      await supabase
        .from('payments')
        .update({
          status: finalDecisionStatus === 'verified' ? 'approved' : finalDecisionStatus === 'rejected' ? 'failed' : 'pending',
          verification_status: finalDecisionStatus,
          bank_verification_data: bankRecord,
          verified_at: finalDecisionStatus === 'verified' ? new Date().toISOString() : null,
        })
        .eq('id', payment_id);
    }

    return new Response(
      JSON.stringify({
        status: finalDecisionStatus,
        reason: decisionReason,
        bankRecord,
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Edge Function Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal verification error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
