'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { employeeSchema, type EmployeeFormValues } from '@/lib/validations/employee';
import type { ActionResult } from './bills';

export async function createEmployee(input: EmployeeFormValues): Promise<ActionResult<{ id: string }>> {
  const parsed = employeeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid employee' };

  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data, error } = await supabase
    .from('employees')
    .insert({
      business_id: business.id,
      name: parsed.data.name,
      mobile: parsed.data.mobile || null,
      status: parsed.data.status,
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to create employee' };
  revalidatePath('/employees');
  return { ok: true, data: { id: data.id } };
}

export async function updateEmployee(id: string, input: EmployeeFormValues): Promise<ActionResult> {
  const parsed = employeeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid employee' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('employees')
    .update({
      name: parsed.data.name,
      mobile: parsed.data.mobile || null,
      status: parsed.data.status,
    })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/employees');
  return { ok: true, data: undefined };
}

// Employees are soft-disabled, not deleted — bills.employee_id references
// them for historical employee-performance reports.
export async function setEmployeeStatus(id: string, status: 'active' | 'inactive'): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('employees').update({ status }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/employees');
  return { ok: true, data: undefined };
}

export async function getEmployeeBillsForCurrentMonth(employeeId: string): Promise<ActionResult<any[]>> {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const { data: bills, error } = await supabase
    .from('bills')
    .select('id, bill_number, bill_date, customer_name, grand_total, status')
    .eq('business_id', business.id)
    .eq('employee_id', employeeId)
    .gte('bill_date', startOfMonth)
    .lte('bill_date', endOfMonth)
    .order('bill_date', { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: bills ?? [] };
}
