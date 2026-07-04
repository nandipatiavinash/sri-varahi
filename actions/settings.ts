'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { settingsSchema, type SettingsFormValues } from '@/lib/validations/settings';
import type { ActionResult } from './bills';

export async function updateSettings(input: SettingsFormValues): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid settings' };

  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { error } = await supabase
    .from('businesses')
    .update({
      name: parsed.data.name,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone,
      edit_window_hours: parsed.data.editWindowHours,
    })
    .eq('id', business.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/settings');
  return { ok: true, data: undefined };
}

/**
 * Full-data JSON export for backup. Runs as an authenticated Server Action
 * under RLS (not a raw pg_dump / service-role export), so it only ever
 * touches the signed-in owner's own business — safe to trigger from a
 * non-technical owner's Settings page.
 */
export async function exportBackup(): Promise<ActionResult<{ json: string }>> {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const [
    employees,
    products,
    bills,
    billItems,
    paymentSplits,
    advanceOrders,
    creditPayments,
    expenses,
  ] = await Promise.all([
    supabase.from('employees').select('*').eq('business_id', business.id),
    supabase.from('products').select('*').eq('business_id', business.id),
    supabase.from('bills').select('*').eq('business_id', business.id),
    supabase
      .from('bill_items')
      .select('*, bills!inner(business_id)')
      .eq('bills.business_id', business.id),
    supabase
      .from('payment_splits')
      .select('*, bills!inner(business_id)')
      .eq('bills.business_id', business.id),
    supabase.from('advance_orders').select('*').eq('business_id', business.id),
    supabase
      .from('credit_payments')
      .select('*, bills!inner(business_id)')
      .eq('bills.business_id', business.id),
    supabase.from('expenses').select('*').eq('business_id', business.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    business,
    employees: employees.data ?? [],
    products: products.data ?? [],
    bills: bills.data ?? [],
    bill_items: billItems.data ?? [],
    payment_splits: paymentSplits.data ?? [],
    advance_orders: advanceOrders.data ?? [],
    credit_payments: creditPayments.data ?? [],
    expenses: expenses.data ?? [],
  };

  return { ok: true, data: { json: JSON.stringify(payload, null, 2) } };
}

/**
 * Restores from a previously exported JSON backup. This is destructive
 * (wipes and replaces current business data), so the UI must show a
 * confirmation step before calling this.
 */
export async function restoreBackup(json: string): Promise<ActionResult> {
  let payload: any;
  try {
    payload = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Invalid backup file — could not parse JSON' };
  }

  const supabase = await createClient();
  const business = await getCurrentBusiness();

  // wipe current data (cascades handle bill_items/payment_splits/credit_payments)
  await supabase.from('bills').delete().eq('business_id', business.id);
  await supabase.from('advance_orders').delete().eq('business_id', business.id);
  await supabase.from('expenses').delete().eq('business_id', business.id);
  await supabase.from('products').delete().eq('business_id', business.id);
  await supabase.from('employees').delete().eq('business_id', business.id);

  const remap = (rows: any[]) =>
    rows.map((r) => ({ ...r, business_id: business.id }));

  if (payload.employees?.length) await supabase.from('employees').insert(remap(payload.employees));
  if (payload.products?.length) await supabase.from('products').insert(remap(payload.products));
  if (payload.bills?.length) await supabase.from('bills').insert(remap(payload.bills));
  if (payload.bill_items?.length) await supabase.from('bill_items').insert(payload.bill_items);
  if (payload.payment_splits?.length) await supabase.from('payment_splits').insert(payload.payment_splits);
  if (payload.advance_orders?.length)
    await supabase.from('advance_orders').insert(remap(payload.advance_orders));
  if (payload.credit_payments?.length)
    await supabase.from('credit_payments').insert(payload.credit_payments);
  if (payload.expenses?.length) await supabase.from('expenses').insert(remap(payload.expenses));

  revalidatePath('/', 'layout');
  return { ok: true, data: undefined };
}
