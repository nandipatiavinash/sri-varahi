// Single source of truth for bill math, used by:
//  - components/billing (live preview while the owner is typing)
//  - actions/bills.ts (source of truth on save)
// Keeping this in one module avoids calculation drift between the two.

export interface LineItemInput {
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
}

export interface PaymentSplitInput {
  method: 'cash' | 'upi' | 'bank' | 'credit' | 'advance';
  amount: number;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function lineTotal(item: LineItemInput): number {
  return round2(item.sellingPrice * item.quantity);
}

export function lineProfit(item: LineItemInput): number {
  return round2((item.sellingPrice - item.purchasePrice) * item.quantity);
}

export function computeSubtotal(items: LineItemInput[]): number {
  return round2(items.reduce((sum, i) => sum + lineTotal(i), 0));
}

export function computeGrossProfit(items: LineItemInput[]): number {
  return round2(items.reduce((sum, i) => sum + lineProfit(i), 0));
}

/**
 * grand_total is owner-editable and intentionally independent from
 * subtotal - discount (manual rounding, negotiated pricing, etc). This
 * helper is only the *suggested* default shown before the owner overrides it.
 */
export function suggestGrandTotal(subtotal: number, discount: number): number {
  return round2(Math.max(0, subtotal - discount));
}

export function computeTotalPaid(splits: PaymentSplitInput[]): number {
  return round2(
    splits.filter((s) => s.method !== 'credit').reduce((sum, s) => sum + s.amount, 0)
  );
}

export function computeBalanceDue(grandTotal: number, paidAmount: number): number {
  return round2(grandTotal - paidAmount);
}

export function deriveBillStatus(
  grandTotal: number,
  paidAmount: number
): 'paid' | 'partial' | 'credit' {
  if (paidAmount <= 0) return 'credit';
  if (paidAmount < grandTotal) return 'partial';
  return 'paid';
}

/** Validates that payment splits sum to no more than grand_total (over-payment is a data-entry error, not a valid state). */
export function validatePaymentSplits(
  splits: PaymentSplitInput[],
  grandTotal: number
): { valid: boolean; message?: string } {
  const total = round2(splits.reduce((sum, s) => sum + s.amount, 0));
  if (total > grandTotal + 0.01) {
    return { valid: false, message: `Payments (₹${total}) exceed the grand total (₹${grandTotal}).` };
  }
  return { valid: true };
}
