'use server';

import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import type { ActionResult } from './bills';

export interface ExportData {
  bills: any[];
  expenses: any[];
  staffSales: any[];
}

export async function getExportData(
  startDate: string,
  endDate: string
): Promise<ActionResult<ExportData>> {
  try {
    const supabase = await createClient();
    const business = await getCurrentBusiness();

    const [billsRes, expensesRes] = await Promise.all([
      supabase
        .from('bills')
        .select(`
          bill_number,
          bill_date,
          customer_name,
          customer_mobile,
          subtotal,
          discount,
          grand_total,
          paid_amount,
          balance_due,
          status,
          employee_id,
          gross_profit,
          employees (name)
        `)
        .eq('business_id', business.id)
        .gte('bill_date', startDate)
        .lte('bill_date', endDate)
        .order('bill_date', { ascending: true }),
      supabase
        .from('expenses')
        .select('date, category, amount, description')
        .eq('business_id', business.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true }),
    ]);

    if (billsRes.error) throw new Error(billsRes.error.message);
    if (expensesRes.error) throw new Error(expensesRes.error.message);

    const bills = billsRes.data ?? [];
    const expenses = expensesRes.data ?? [];

    // Aggregate staff sales
    const staffSalesMap = new Map<string, { name: string; count: number; sales: number; profit: number }>();
    bills.forEach((b) => {
      if (b.status === 'voided') return;
      if (!b.employee_id) return;
      
      const empName = (b.employees as any)?.name || 'Unknown';
      const prev = staffSalesMap.get(b.employee_id) || { name: empName, count: 0, sales: 0, profit: 0 };
      prev.count += 1;
      prev.sales += Number(b.grand_total);
      prev.profit += Number(b.gross_profit || 0);
      staffSalesMap.set(b.employee_id, prev);
    });
    
    const staffSales = Array.from(staffSalesMap.values());

    return {
      ok: true,
      data: {
        bills: bills.map((b) => ({
          'Bill Number': b.bill_number,
          'Date': b.bill_date,
          'Customer Name': b.customer_name,
          'Customer Mobile': b.customer_mobile || '—',
          'Sales Executive (Staff)': (b.employees as any)?.name || '—',
          'Subtotal': Number(b.subtotal),
          'Discount': Number(b.discount),
          'Grand Total': Number(b.grand_total),
          'Paid Amount': Number(b.paid_amount),
          'Balance Due': Number(b.balance_due),
          'Status': b.status,
        })),
        expenses: expenses.map((e) => ({
          'Date': e.date,
          'Category': e.category,
          'Amount': Number(e.amount),
          'Description': e.description || '—',
        })),
        staffSales: staffSales.map((s) => ({
          'Staff Name': s.name,
          'Bills Handled': s.count,
          'Total Sales': s.sales,
          'Total Profit': s.profit,
        })),
      },
    };
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch export data' };
  }
}
