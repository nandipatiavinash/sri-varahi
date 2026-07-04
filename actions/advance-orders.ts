'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { advanceOrderSchema, type AdvanceOrderFormValues } from '@/lib/validations/advance-order';
import type { ActionResult } from './bills';

export async function createAdvanceOrder(
  input: AdvanceOrderFormValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = advanceOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid advance order' };

  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data, error } = await supabase
    .from('advance_orders')
    .insert({
      business_id: business.id,
      customer_name: parsed.data.customerName,
      customer_mobile: parsed.data.customerMobile || null,
      advance_amount: parsed.data.advanceAmount,
      expected_delivery_date: parsed.data.expectedDeliveryDate || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to create advance order' };
  revalidatePath('/advance-orders');
  return { ok: true, data: { id: data.id } };
}

export async function updateAdvanceOrder(
  id: string,
  input: AdvanceOrderFormValues
): Promise<ActionResult> {
  const parsed = advanceOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid advance order' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('advance_orders')
    .update({
      customer_name: parsed.data.customerName,
      customer_mobile: parsed.data.customerMobile || null,
      advance_amount: parsed.data.advanceAmount,
      expected_delivery_date: parsed.data.expectedDeliveryDate || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
    })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/advance-orders');
  return { ok: true, data: undefined };
}

export async function cancelAdvanceOrder(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('advance_orders')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/advance-orders');
  return { ok: true, data: undefined };
}

/**
 * Marks the advance order "completed" and links it to a bill created from
 * the New Sale form (the form pre-fills customer + an "advance" payment
 * split equal to advance_amount when launched from this order).
 */
export async function convertAdvanceOrderToBill(
  advanceOrderId: string,
  billId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: order, error: fetchError } = await supabase
    .from('advance_orders')
    .select('id, business_id, status')
    .eq('id', advanceOrderId)
    .single();

  if (fetchError || !order) return { ok: false, error: 'Advance order not found' };
  if (order.business_id !== business.id) return { ok: false, error: 'Not authorized' };
  if (order.status === 'completed') return { ok: false, error: 'Order already converted' };

  const { error } = await supabase
    .from('advance_orders')
    .update({ status: 'completed', converted_bill_id: billId })
    .eq('id', advanceOrderId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/advance-orders');
  revalidatePath('/sales');
  return { ok: true, data: undefined };
}
