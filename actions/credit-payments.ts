'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { creditPaymentSchema } from '@/lib/validations/bill';
import type { ActionResult } from './bills';

// Recording a partial/credit payment is NOT restricted by the same-day
// edit window — a customer paying off an old credit bill next month is
// the whole point of the credit-customers feature. Only editing/deleting
// the original bill's line items & totals is same-day-only.
export async function recordCreditPayment(input: {
  billId: string;
  amount: number;
  method: 'cash' | 'upi' | 'bank';
  notes?: string;
}): Promise<ActionResult<{ id: string }>> {
  const parsed = creditPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid payment' };
  }

  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: bill, error: billError } = await supabase
    .from('bills')
    .select('id, business_id, balance_due, voided_at')
    .eq('id', parsed.data.billId)
    .single();

  if (billError || !bill) return { ok: false, error: 'Bill not found' };
  if (bill.business_id !== business.id) return { ok: false, error: 'Not authorized' };
  if (bill.voided_at) return { ok: false, error: 'Cannot record payment on a voided bill' };
  if (parsed.data.amount > Number(bill.balance_due) + 0.01) {
    return { ok: false, error: `Payment (₹${parsed.data.amount}) exceeds balance due (₹${bill.balance_due})` };
  }

  const { data: payment, error } = await supabase
    .from('credit_payments')
    .insert({
      bill_id: parsed.data.billId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      notes: parsed.data.notes || null,
    })
    .select('id')
    .single();

  if (error || !payment) return { ok: false, error: error?.message ?? 'Failed to record payment' };

  await supabase.from('activity_log').insert({
    business_id: business.id,
    entity_type: 'bill',
    entity_id: parsed.data.billId,
    action: 'updated',
    detail: { credit_payment: parsed.data.amount, method: parsed.data.method },
  });

  revalidatePath('/', 'layout');
  return { ok: true, data: { id: payment.id } };
}
