'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { billSchema, type BillFormValues } from '@/lib/validations/bill';
import {
  computeSubtotal,
  computeGrossProfit,
  computeTotalPaid,
  validatePaymentSplits,
  deriveBillStatus,
} from '@/lib/billing/calculate';
import { checkBillEditWindow } from '@/lib/edit-window';

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export async function createBill(input: BillFormValues): Promise<ActionResult<{ id: string }>> {
  const parsed = billSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid bill data' };
  }
  const data = parsed.data;

  const paymentCheck = validatePaymentSplits(
    data.paymentSplits.map((s) => ({ method: s.method, amount: s.amount })),
    data.grandTotal
  );
  if (!paymentCheck.valid) {
    return { ok: false, error: paymentCheck.message! };
  }

  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const subtotal = computeSubtotal(
    data.items.map((i) => ({
      quantity: i.quantity,
      purchasePrice: i.purchasePrice,
      sellingPrice: i.sellingPrice,
    }))
  );
  const grossProfit = computeGrossProfit(
    data.items.map((i) => ({
      quantity: i.quantity,
      purchasePrice: i.purchasePrice,
      sellingPrice: i.sellingPrice,
    }))
  );
  const paidAmount = computeTotalPaid(data.paymentSplits);
  const status = deriveBillStatus(data.grandTotal, paidAmount);

  const { data: bill, error: billError } = await supabase
    .from('bills')
    .insert({
      business_id: business.id,
      bill_number: data.billNumber,
      bill_date: data.billDate,
      customer_name: data.customerName,
      customer_mobile: data.customerMobile || null,
      employee_id: data.employeeId || null,
      subtotal,
      discount: data.discount,
      grand_total: data.grandTotal,
      gross_profit: grossProfit,
      paid_amount: paidAmount,
      status,
      notes: data.notes || null,
    })
    .select('id')
    .single();

  if (billError || !bill) {
    return { ok: false, error: billError?.message ?? 'Failed to create bill' };
  }

  const { error: itemsError } = await supabase.from('bill_items').insert(
    data.items.map((i) => ({
      bill_id: bill.id,
      product_id: i.productId,
      product_name_snapshot: i.productName,
      quantity: i.quantity,
      purchase_price: i.purchasePrice,
      selling_price: i.sellingPrice,
    }))
  );
  if (itemsError) {
    await supabase.from('bills').delete().eq('id', bill.id); // rollback
    return { ok: false, error: itemsError.message };
  }

  const { error: splitsError } = await supabase.from('payment_splits').insert(
    data.paymentSplits
      .filter((s) => s.amount > 0)
      .map((s) => ({ bill_id: bill.id, method: s.method, amount: s.amount }))
  );
  if (splitsError) {
    await supabase.from('bills').delete().eq('id', bill.id); // rollback
    return { ok: false, error: splitsError.message };
  }

  await supabase.from('activity_log').insert({
    business_id: business.id,
    entity_type: 'bill',
    entity_id: bill.id,
    action: 'created',
    detail: { bill_number: data.billNumber, grand_total: data.grandTotal },
  });

  revalidatePath('/sales');
  revalidatePath('/dashboard');
  return { ok: true, data: { id: bill.id } };
}

// ---------------------------------------------------------------------------
// Same-day edit / delete guard (server-side source of truth)
// ---------------------------------------------------------------------------
async function assertBillIsEditable(billId: string) {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: bill, error } = await supabase
    .from('bills')
    .select('id, created_at, voided_at, business_id')
    .eq('id', billId)
    .single();

  if (error || !bill) throw new Error('Bill not found');
  if (bill.business_id !== business.id) throw new Error('Not authorized');
  if (bill.voided_at) throw new Error('This bill has already been voided');

  const check = checkBillEditWindow(
    bill.created_at,
    new Date(),
    business.timezone,
    business.edit_window_hours
  );
  if (!check.editable) throw new Error(check.reason);

  return { supabase, business, bill };
}

// ---------------------------------------------------------------------------
// Update (same-day only)
// ---------------------------------------------------------------------------
export async function updateBill(
  billId: string,
  input: BillFormValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = billSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid bill data' };
  }
  const data = parsed.data;

  const paymentCheck = validatePaymentSplits(
    data.paymentSplits.map((s) => ({ method: s.method, amount: s.amount })),
    data.grandTotal
  );
  if (!paymentCheck.valid) {
    return { ok: false, error: paymentCheck.message! };
  }

  let supabase, business;
  try {
    ({ supabase, business } = await assertBillIsEditable(billId));
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Not editable' };
  }

  const subtotal = computeSubtotal(data.items);
  const grossProfit = computeGrossProfit(data.items);
  const paidAmount = computeTotalPaid(data.paymentSplits);
  const status = deriveBillStatus(data.grandTotal, paidAmount);

  const { error: billError } = await supabase
    .from('bills')
    .update({
      bill_number: data.billNumber,
      bill_date: data.billDate,
      customer_name: data.customerName,
      customer_mobile: data.customerMobile || null,
      employee_id: data.employeeId || null,
      subtotal,
      discount: data.discount,
      grand_total: data.grandTotal,
      gross_profit: grossProfit,
      paid_amount: paidAmount,
      status,
      notes: data.notes || null,
    })
    .eq('id', billId);

  if (billError) return { ok: false, error: billError.message };

  // Replace line items & payment splits wholesale — simplest correct approach
  // for a same-day edit window (they're not "immutable" until the day ends).
  await supabase.from('bill_items').delete().eq('bill_id', billId);
  const { error: itemsError } = await supabase.from('bill_items').insert(
    data.items.map((i) => ({
      bill_id: billId,
      product_id: i.productId,
      product_name_snapshot: i.productName,
      quantity: i.quantity,
      purchase_price: i.purchasePrice,
      selling_price: i.sellingPrice,
    }))
  );
  if (itemsError) return { ok: false, error: itemsError.message };

  await supabase.from('payment_splits').delete().eq('bill_id', billId);
  const { error: splitsError } = await supabase.from('payment_splits').insert(
    data.paymentSplits
      .filter((s) => s.amount > 0)
      .map((s) => ({ bill_id: billId, method: s.method, amount: s.amount }))
  );
  if (splitsError) return { ok: false, error: splitsError.message };

  await supabase.from('activity_log').insert({
    business_id: business.id,
    entity_type: 'bill',
    entity_id: billId,
    action: 'updated',
    detail: { bill_number: data.billNumber, grand_total: data.grandTotal },
  });

  revalidatePath('/sales');
  revalidatePath(`/sales/${billId}`);
  revalidatePath('/dashboard');
  return { ok: true, data: { id: billId } };
}

// ---------------------------------------------------------------------------
// Delete (hard delete, same-day only — cascades to bill_items/payment_splits)
// ---------------------------------------------------------------------------
export async function deleteBill(billId: string): Promise<ActionResult> {
  let supabase, business, bill;
  try {
    ({ supabase, business, bill } = await assertBillIsEditable(billId));
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Not deletable' };
  }

  const { error } = await supabase.from('bills').delete().eq('id', billId);
  if (error) return { ok: false, error: error.message };

  await supabase.from('activity_log').insert({
    business_id: business.id,
    entity_type: 'bill',
    entity_id: bill.id,
    action: 'deleted',
    detail: null,
  });

  revalidatePath('/sales');
  revalidatePath('/dashboard');
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Void (always allowed, any day — the safe way to reverse an old bill)
// ---------------------------------------------------------------------------
export async function voidBill(billId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: bill, error: fetchError } = await supabase
    .from('bills')
    .select('id, business_id, voided_at')
    .eq('id', billId)
    .single();

  if (fetchError || !bill) return { ok: false, error: 'Bill not found' };
  if (bill.business_id !== business.id) return { ok: false, error: 'Not authorized' };
  if (bill.voided_at) return { ok: false, error: 'Bill is already voided' };

  const { error } = await supabase
    .from('bills')
    .update({ voided_at: new Date().toISOString(), status: 'voided' })
    .eq('id', billId);

  if (error) return { ok: false, error: error.message };

  await supabase.from('activity_log').insert({
    business_id: business.id,
    entity_type: 'bill',
    entity_id: billId,
    action: 'voided',
    detail: null,
  });

  revalidatePath('/sales');
  revalidatePath(`/sales/${billId}`);
  revalidatePath('/dashboard');
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------
export async function getNextSuggestedBillNumber(): Promise<string> {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data } = await supabase
    .from('bills')
    .select('bill_number')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.bill_number) return 'SV-1001';

  const match = data.bill_number.match(/^(.*?)(\d+)$/);
  if (!match) return data.bill_number + '-1';

  const [, prefix, digits] = match;
  const next = (parseInt(digits, 10) + 1).toString().padStart(digits.length, '0');
  return `${prefix}${next}`;
}
