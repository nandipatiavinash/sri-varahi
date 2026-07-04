'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { expenseSchema, type ExpenseFormValues } from '@/lib/validations/expense';
import type { ActionResult } from './bills';

export async function createExpense(input: ExpenseFormValues): Promise<ActionResult<{ id: string }>> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid expense' };

  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      business_id: business.id,
      date: parsed.data.date,
      category: parsed.data.category,
      amount: parsed.data.amount,
      description: parsed.data.description || null,
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to create expense' };
  revalidatePath('/expenses');
  revalidatePath('/dashboard');
  return { ok: true, data: { id: data.id } };
}

export async function updateExpense(id: string, input: ExpenseFormValues): Promise<ActionResult> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid expense' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('expenses')
    .update({
      date: parsed.data.date,
      category: parsed.data.category,
      amount: parsed.data.amount,
      description: parsed.data.description || null,
    })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/expenses');
  revalidatePath('/dashboard');
  return { ok: true, data: undefined };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/expenses');
  revalidatePath('/dashboard');
  return { ok: true, data: undefined };
}
