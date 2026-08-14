// Universal Ethiopian Receipt OCR Vision & Text Extractor
// Tailored for Telebirr and CBE Mobile Banking (Light, Dark, CBE Birr App, SMS, and Legacy PDF)

export interface ParsedReceipt {
  provider: 'telebirr' | 'cbe' | 'unknown';
  transactionId: string | null;
  recipientName: string | null;
  recipientAccount: string | null;
  amount: number | null;
  transactionDate: string | null;
  isValidReceiptLayout: boolean;
}

export interface VerificationAssertionResult {
  isValid: boolean;
  status: 'verified' | 'manual_review' | 'rejected';
  reason: string;
  parsedData: ParsedReceipt;
}

const OFFICIAL_CBE_NAMES = [
  'GENENE TISE MEKONEN',
  'GENENE TISE',
  'GENENE TISE MOKONA',
  'GENENE TISE MEKONNEN',
];

const OFFICIAL_TELEBIRR_NAMES = [
  'GENENE',
];

const OFFICIAL_CBE_SUFFIX = '1353';
const OFFICIAL_CBE_FULL_ACCOUNT = '1000272681353';

/**
 * Parses OCR/extracted text string from Ethiopian bank & telecom receipts
 */
export function parseReceiptText(text: string): ParsedReceipt {
  if (!text || text.trim().length === 0) {
    return {
      provider: 'unknown',
      transactionId: null,
      recipientName: null,
      recipientAccount: null,
      amount: null,
      transactionDate: null,
      isValidReceiptLayout: false,
    };
  }

  const cleanText = text.replace(/\r/g, '');
  let provider: 'telebirr' | 'cbe' | 'unknown' = 'unknown';
  let transactionId: string | null = null;
  let recipientName: string | null = null;
  let recipientAccount: string | null = null;
  let amount: number | null = null;
  let transactionDate: string | null = null;

  // 1. Determine Provider
  const upperText = cleanText.toUpperCase();
  if (
    upperText.includes('TELEBIRR') || 
    upperText.includes('TELEPLAY') || 
    upperText.includes('TRANSACTION TO:') || 
    upperText.includes('TRANSACTION NUMBER:')
  ) {
    provider = 'telebirr';
  } else if (
    upperText.includes('CBE') || 
    upperText.includes('COMMERCIAL BANK OF ETHIOPIA') || 
    upperText.includes('DEBITED FROM') || 
    upperText.includes('FT REFERENCE:') ||
    upperText.includes('MBRECEIPT.CBE.COM.ET') ||
    upperText.includes('APPS.CBE.COM.ET')
  ) {
    provider = 'cbe';
  }

  // 2. Extract Ref ID (Transaction ID / Reference)
  // Variant 1 & 4 (CBE FT Reference): e.g. FT26204HMHYF, FT26226NC77B, FT26226MWCMD
  const ftMatch = cleanText.match(/\b(FT[A-Z0-9]{10})\b/i);
  if (ftMatch) {
    transactionId = ftMatch[1].toUpperCase();
  } else {
    // Variant 3 (CBE Birr): e.g. DFP11GRSWJN
    const cbeBirrMatch = cleanText.match(/Transaction ID:\s*([A-Z0-9]{8,16})/i);
    if (cbeBirrMatch) {
      transactionId = cbeBirrMatch[1].toUpperCase();
    } else {
      // Variant 2 (Telebirr): e.g. DHB2P3E7LW, DGR2ADRR82
      const teleMatch = cleanText.match(/Transaction Number:\s*([A-Z0-9]{8,16})/i);
      if (teleMatch) {
        transactionId = teleMatch[1].toUpperCase();
      } else {
        // Generic Ref Link fallback: e.g. mbreciept.cbe.com.et/v2-xxx or apps.cbe.com.et:100/?id=xxx
        const linkMatch = cleanText.match(/https?:\/\/[^\s]+/i);
        if (linkMatch) {
          transactionId = linkMatch[0];
        }
      }
    }
  }

  // 3. Extract Amount
  // Pattern A: "ETB 300,000.00 has been debited" or "ETB 1.00 has been debited" or "ETB 2,000 debited"
  const debitedAmountMatch = cleanText.match(/ETB\s*([0-9,.]+)\s+debited/i) || cleanText.match(/ETB\s*([0-9,.]+)\s+has been debited/i);
  if (debitedAmountMatch) {
    const rawAmt = debitedAmountMatch[1].replace(/,/g, '');
    amount = parseFloat(rawAmt);
  } else {
    // Pattern B: Telebirr "-402.00 (ETB)" or "-6.00 (ETB)"
    const teleAmtMatch = cleanText.match(/-?\s*([0-9,.]+)\s*\(ETB\)/i);
    if (teleAmtMatch) {
      const rawAmt = teleAmtMatch[1].replace(/,/g, '');
      amount = parseFloat(rawAmt);
    } else {
      // Pattern C: CBE Dark theme "ETB 1.00"
      const darkAmtMatch = cleanText.match(/ETB\s*([0-9,.]+)/i);
      if (darkAmtMatch) {
        const rawAmt = darkAmtMatch[1].replace(/,/g, '');
        amount = parseFloat(rawAmt);
      }
    }
  }

  // 4. Extract Recipient Name & Account Suffix
  // CBE Pattern Light: "... for Genene Tise Mekonen ETB-1353"
  const cbeLightRecipientMatch = cleanText.match(/\bfor\s+([A-Za-z\s]+?)\s+ETB-(\d{4})/i);
  if (cbeLightRecipientMatch) {
    recipientName = cbeLightRecipientMatch[1].trim();
    recipientAccount = cbeLightRecipientMatch[2].trim();
  } else {
    // CBE Dark Pattern: "Recipient Name Genene Tise Mekonen"
    const cbeDarkNameMatch = cleanText.match(/Recipient Name[:\s]*([^\n]+)/i);
    if (cbeDarkNameMatch) {
      recipientName = cbeDarkNameMatch[1].replace(/^[:\s]+/, '').trim();
    }
    const cbeDarkAccMatch = cleanText.match(/Recipient Account[:\s]*([^\n]+)/i);
    if (cbeDarkAccMatch) {
      recipientAccount = cbeDarkAccMatch[1].replace(/^[:\s]+/, '').trim();
    }

    // Telebirr Pattern: "Transaction To: Mohammed"
    if (!recipientName) {
      const teleToMatch = cleanText.match(/Transaction To:[:\s]*([^\n]+)/i);
      if (teleToMatch) {
        recipientName = teleToMatch[1].replace(/^[:\s]+/, '').trim();
      }
    }

    // CBE Birr Pattern: "... for Genene Tise Mokona on 25 Jun ..."
    if (!recipientName) {
      const cbeBirrForMatch = cleanText.match(/\bfor\s+([A-Za-z\s]+?)\s+on\b/i);
      if (cbeBirrForMatch) {
        recipientName = cbeBirrForMatch[1].trim();
      }
    }
  }

  const isValidLayout = provider !== 'unknown' || !!transactionId || !!recipientName || amount !== null;

  return {
    provider,
    transactionId,
    recipientName,
    recipientAccount,
    amount,
    transactionDate,
    isValidReceiptLayout: isValidLayout,
  };
}

/**
 * Asserts recipient name, recipient account, and paid amount against requirements
 */
export function assertReceiptValidity(
  parsed: ParsedReceipt,
  expectedProvider: 'telebirr' | 'cbe',
  expectedAmountEtb: number
): VerificationAssertionResult {
  if (!parsed.isValidReceiptLayout) {
    return {
      isValid: false,
      status: 'rejected',
      reason: 'Uploaded image is not a valid Telebirr or CBE receipt screenshot.',
      parsedData: parsed,
    };
  }

  // 1. Recipient Assertion
  if (parsed.recipientName) {
    const normRecipient = parsed.recipientName.toUpperCase();
    if (expectedProvider === 'telebirr') {
      const isTelebirrOk = OFFICIAL_TELEBIRR_NAMES.some(name => normRecipient.includes(name));
      if (!isTelebirrOk) {
        return {
          isValid: false,
          status: 'rejected',
          reason: `Receipt recipient is "${parsed.recipientName}". Expected official Telebirr account "Genene".`,
          parsedData: parsed,
        };
      }
    } else {
      const isCbeNameOk = OFFICIAL_CBE_NAMES.some(name => normRecipient.includes(name));
      const isCbeAccOk = parsed.recipientAccount ? parsed.recipientAccount.endsWith(OFFICIAL_CBE_SUFFIX) : false;
      if (!isCbeNameOk && !isCbeAccOk) {
        return {
          isValid: false,
          status: 'rejected',
          reason: `Receipt recipient is "${parsed.recipientName}" ${parsed.recipientAccount ? `(Account: ${parsed.recipientAccount})` : ''}. Expected official CBE account "Genene Tise" (ETB-1353).`,
          parsedData: parsed,
        };
      }
    }
  }

  // 2. Account Suffix Assertion (if parsed)
  if (parsed.recipientAccount && expectedProvider === 'cbe') {
    const accClean = parsed.recipientAccount.replace(/[^0-9]/g, '');
    if (accClean.length >= 4 && !accClean.endsWith(OFFICIAL_CBE_SUFFIX)) {
      return {
        isValid: false,
        status: 'rejected',
        reason: `Receipt recipient account is ETB-${accClean.slice(-4)} (Expected official CBE account ending in 1353).`,
        parsedData: parsed,
      };
    }
  }

  // 3. Amount Assertion
  if (parsed.amount !== null && parsed.amount < expectedAmountEtb) {
    return {
      isValid: false,
      status: 'rejected',
      reason: `Paid amount on receipt is ETB ${parsed.amount.toLocaleString()} (Expected ETB ${expectedAmountEtb.toLocaleString()} for this package).`,
      parsedData: parsed,
    };
  }

  return {
    isValid: true,
    status: 'verified',
    reason: 'Receipt vision assertions passed 100%.',
    parsedData: parsed,
  };
}
