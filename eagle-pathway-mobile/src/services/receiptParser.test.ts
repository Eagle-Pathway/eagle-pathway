import { describe, it, expect } from 'vitest';
import { parseReceiptText, assertReceiptValidity } from './receiptParser';

describe('receiptParser - All 5 Ethiopian Receipt Screenshot Layout Variants', () => {

  it('Variant 1: CBE Mobile Light Theme Receipt', () => {
    const rawText = `
      Thank you Success
      Transaction Summary
      ETB 300,000.00 has been debited from Mintesinot Tesfaye Megiso ETB-7271 for Genene Tise Mekonen ETB-1353 on Jul 23, 2026 11:09 AM with transaction ID: FT26204HMHYF. Reason: MB Transfer
    `;

    const parsed = parseReceiptText(rawText);
    expect(parsed.provider).toBe('cbe');
    expect(parsed.transactionId).toBe('FT26204HMHYF');
    expect(parsed.recipientName).toBe('Genene Tise Mekonen');
    expect(parsed.recipientAccount).toBe('1353');
    expect(parsed.amount).toBe(300000);

    const assertion = assertReceiptValidity(parsed, 'cbe', 10000);
    expect(assertion.isValid).toBe(true);
    expect(assertion.status).toBe('verified');
  });

  it('Variant 2: Telebirr Receipt with Wrong Recipient (Mohammed) & Insufficient Amount', () => {
    const rawText = `
      Successful
      Payment Method
      -6.00 (ETB)
      Transaction Time: 2026/08/11 12:26:17
      Transaction Type: Transfer Money
      Transaction To: Mohammed
      Transaction Number: DHB2P3E7LW
    `;

    const parsed = parseReceiptText(rawText);
    expect(parsed.provider).toBe('telebirr');
    expect(parsed.transactionId).toBe('DHB2P3E7LW');
    expect(parsed.recipientName).toBe('Mohammed');
    expect(parsed.amount).toBe(6);

    const assertion = assertReceiptValidity(parsed, 'telebirr', 10000);
    expect(assertion.isValid).toBe(false);
    expect(assertion.status).toBe('rejected');
    expect(assertion.reason).toContain('Receipt recipient is "Mohammed"');
  });

  it('Variant 3: CBE Birr App Receipt', () => {
    const rawText = `
      Transaction Details
      Thank you! Success
      ETB 2,000 debited from Chernet Woyessa Wote for Genene Tise Mokona on 25 Jun 2026 with Transaction ID: DFP11GRSWJN via CBE Birr mobile app's Send Money (bs).
    `;

    const parsed = parseReceiptText(rawText);
    expect(parsed.provider).toBe('cbe');
    expect(parsed.transactionId).toBe('DFP11GRSWJN');
    expect(parsed.recipientName).toBe('Genene Tise Mokona');
    expect(parsed.amount).toBe(2000);

    const assertion = assertReceiptValidity(parsed, 'cbe', 2000);
    expect(assertion.isValid).toBe(true);
  });

  it('Variant 4: CBE Mobile Small Amount (ETB 1.00) underpayment check', () => {
    const rawText = `
      Transaction Summary
      ETB 1.00 has been debited from Genene Tise Mekonen ETB-9835 for Genene Tise Mekonen ETB-1353 on Aug 14, 2026 06:53 PM with transaction ID: FT26226NC77B.
    `;

    const parsed = parseReceiptText(rawText);
    expect(parsed.provider).toBe('cbe');
    expect(parsed.transactionId).toBe('FT26226NC77B');
    expect(parsed.recipientName).toBe('Genene Tise Mekonen');
    expect(parsed.recipientAccount).toBe('1353');
    expect(parsed.amount).toBe(1);

    const assertion = assertReceiptValidity(parsed, 'cbe', 10000);
    expect(assertion.isValid).toBe(false);
    expect(assertion.status).toBe('rejected');
    expect(assertion.reason).toContain('Paid amount on receipt is ETB 1');
  });

  it('Variant 5: CBE Mobile Dark Theme with Wrong Recipient Account (ETB-9835)', () => {
    const rawText = `
      Transaction successful!
      ETB 1.00
      Transaction Type: With in CBE
      Sender Name: Genene Tise Mekonen
      Sender Account: 10••••••1353
      Recipient Name: Genene Tise Mekonen
      Recipient Account: 10••••••9835
      FT Reference: FT26226MWCMD
    `;

    const parsed = parseReceiptText(rawText);
    expect(parsed.provider).toBe('cbe');
    expect(parsed.transactionId).toBe('FT26226MWCMD');
    expect(parsed.recipientName).toBe('Genene Tise Mekonen');
    expect(parsed.recipientAccount).toBe('10••••••9835');

    const assertion = assertReceiptValidity(parsed, 'cbe', 10000);
    expect(assertion.isValid).toBe(false);
    expect(assertion.status).toBe('rejected');
    expect(assertion.reason).toContain('ETB-9835');
  });

  it('Variant 6: Telebirr Receipt with Correct Recipient (Genene)', () => {
    const rawText = `
      Successful
      Payment Method
      -10,000.00 (ETB)
      Transaction Time: 2026/08/14 17:22:55
      Transaction Type: Transfer Money
      Transaction To: Genene
      Transaction Number: DHE0RRRPZO
    `;

    const parsed = parseReceiptText(rawText);
    expect(parsed.provider).toBe('telebirr');
    expect(parsed.transactionId).toBe('DHE0RRRPZO');
    expect(parsed.recipientName).toBe('Genene');
    expect(parsed.amount).toBe(10000);

    const assertion = assertReceiptValidity(parsed, 'telebirr', 10000);
    expect(assertion.isValid).toBe(true);
    expect(assertion.status).toBe('verified');
  });

});
