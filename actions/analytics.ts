'use server';

import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import type { ActionResult } from './bills';

export interface DayBillInfo {
  id: string;
  bill_number: string;
  bill_date: string;
  customer_name: string;
  customer_mobile: string | null;
  grand_total: number;
  gross_profit: number;
  paid_amount: number;
  balance_due: number;
  status: string;
  employee_name: string | null;
}

export interface AnalyticsData {
  daysData: {
    [dayStr: string]: {
      sales: number;
      profit: number;
      billsCount: number;
      bills: DayBillInfo[];
    };
  };
  monthlySales: number;
  monthlyProfit: number;
  monthlyExpenses: number;
  monthlyNetProfit: number;
  averageBill: number;
  totalInvoicesCount: number;
  paymentBreakdown: {
    upi: number;
    cash: number;
    bank: number;
  };
  topProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

export async function getAnalyticsData(monthStr: string): Promise<ActionResult<AnalyticsData>> {
  try {
    const supabase = await createClient();
    const business = await getCurrentBusiness();

    const startOfMonth = `${monthStr}-01`;
    // Calculate last day of the month
    const parts = monthStr.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${monthStr}-${lastDay.toString().padStart(2, '0')}`;

    // 1. Fetch bills in date range (including employees info)
    const { data: bills, error: billsErr } = await supabase
      .from('bills')
      .select(`
        id,
        bill_number,
        bill_date,
        customer_name,
        customer_mobile,
        grand_total,
        gross_profit,
        paid_amount,
        balance_due,
        status,
        employee_id,
        employees (name)
      `)
      .eq('business_id', business.id)
      .gte('bill_date', startOfMonth)
      .lte('bill_date', endOfMonth)
      .order('created_at', { ascending: false });

    if (billsErr) throw new Error(billsErr.message);

    // 2. Fetch expenses in date range
    const { data: expenses, error: expErr } = await supabase
      .from('expenses')
      .select('amount, date')
      .eq('business_id', business.id)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    if (expErr) throw new Error(expErr.message);

    // 3. Fetch payment splits for payment breakdown
    const { data: splits, error: splitsErr } = await supabase
      .from('payment_splits')
      .select('amount, method, bills!inner(bill_date, status, business_id)')
      .eq('bills.business_id', business.id)
      .gte('bills.bill_date', startOfMonth)
      .lte('bills.bill_date', endOfMonth)
      .neq('bills.status', 'voided');

    if (splitsErr) throw new Error(splitsErr.message);

    // 4. Fetch bill items for top services/products
    const { data: billItems, error: itemsErr } = await supabase
      .from('bill_items')
      .select('product_name_snapshot, quantity, selling_price, bills!inner(bill_date, status, business_id)')
      .eq('bills.business_id', business.id)
      .gte('bills.bill_date', startOfMonth)
      .lte('bills.bill_date', endOfMonth)
      .neq('bills.status', 'voided');

    if (itemsErr) throw new Error(itemsErr.message);

    // 5. Process values in JS
    const monthlyExpenses = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

    const activeBills = (bills ?? []).filter((b) => b.status !== 'voided');
    const totalSales = activeBills.reduce((sum, b) => sum + Number(b.grand_total), 0);
    const totalProfit = activeBills.reduce((sum, b) => sum + Number(b.gross_profit), 0);
    const invoiceCount = activeBills.length;
    const averageBill = invoiceCount > 0 ? totalSales / invoiceCount : 0;

    // Daily breakdown mapping
    const daysData: AnalyticsData['daysData'] = {};

    // Initialize every day of the month with zero
    for (let d = 1; d <= lastDay; d++) {
      const dayStr = `${monthStr}-${d.toString().padStart(2, '0')}`;
      daysData[dayStr] = { sales: 0, profit: 0, billsCount: 0, bills: [] };
    }

    // Populate daily data
    (bills ?? []).forEach((b) => {
      const dateStr = b.bill_date;
      if (!daysData[dateStr]) {
        daysData[dateStr] = { sales: 0, profit: 0, billsCount: 0, bills: [] };
      }

      // Add to list of bills
      daysData[dateStr].bills.push({
        id: b.id,
        bill_number: b.bill_number,
        bill_date: b.bill_date,
        customer_name: b.customer_name,
        customer_mobile: b.customer_mobile,
        grand_total: Number(b.grand_total),
        gross_profit: Number(b.gross_profit),
        paid_amount: Number(b.paid_amount),
        balance_due: Number(b.balance_due),
        status: b.status,
        employee_name: (b.employees as any)?.name || null,
      });

      if (b.status !== 'voided') {
        daysData[dateStr].sales += Number(b.grand_total);
        daysData[dateStr].profit += Number(b.gross_profit);
        daysData[dateStr].billsCount += 1;
      }
    });

    // Payment breakdown processing
    const paymentBreakdown = { upi: 0, cash: 0, bank: 0 };
    (splits ?? []).forEach((s) => {
      const method = s.method as 'upi' | 'cash' | 'bank';
      if (paymentBreakdown[method] !== undefined) {
        paymentBreakdown[method] += Number(s.amount);
      }
    });

    // Top products processing
    const productsMap = new Map<string, { quantity: number; revenue: number }>();
    (billItems ?? []).forEach((item) => {
      const name = item.product_name_snapshot;
      const qty = Number(item.quantity);
      const rev = Number(item.selling_price) * qty;

      const prev = productsMap.get(name) || { quantity: 0, revenue: 0 };
      productsMap.set(name, {
        quantity: prev.quantity + qty,
        revenue: prev.revenue + rev,
      });
    });

    const topProducts = Array.from(productsMap.entries())
      .map(([name, stats]) => ({
        name,
        quantity: stats.quantity,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      ok: true,
      data: {
        daysData,
        monthlySales: totalSales,
        monthlyProfit: totalProfit,
        monthlyExpenses,
        monthlyNetProfit: totalProfit - monthlyExpenses,
        averageBill,
        totalInvoicesCount: invoiceCount,
        paymentBreakdown,
        topProducts,
      },
    };
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch analytics data' };
  }
}

export interface ReportData {
  bills: DayBillInfo[];
  expenses: {
    date: string;
    category: string;
    description: string | null;
    amount: number;
  }[];
  productSales: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  summary: {
    totalRevenue: number;
    totalProfit: number;
    totalExpenses: number;
    netProfit: number;
    invoicesCount: number;
  };
}

export async function getCustomRangeReport(
  startDate: string,
  endDate: string
): Promise<ActionResult<ReportData>> {
  try {
    const supabase = await createClient();
    const business = await getCurrentBusiness();

    // 1. Fetch bills
    const { data: bills, error: billsErr } = await supabase
      .from('bills')
      .select(`
        id,
        bill_number,
        bill_date,
        customer_name,
        customer_mobile,
        grand_total,
        gross_profit,
        paid_amount,
        balance_due,
        status,
        employee_id,
        employees (name)
      `)
      .eq('business_id', business.id)
      .gte('bill_date', startDate)
      .lte('bill_date', endDate)
      .order('bill_date', { ascending: true });

    if (billsErr) throw new Error(billsErr.message);

    // 2. Fetch expenses
    const { data: expenses, error: expErr } = await supabase
      .from('expenses')
      .select('date, category, description, amount')
      .eq('business_id', business.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (expErr) throw new Error(expErr.message);

    // 3. Fetch bill items
    const { data: billItems, error: itemsErr } = await supabase
      .from('bill_items')
      .select('product_name_snapshot, quantity, selling_price, bills!inner(bill_date, status, business_id)')
      .eq('bills.business_id', business.id)
      .gte('bills.bill_date', startDate)
      .lte('bills.bill_date', endDate)
      .neq('bills.status', 'voided');

    if (itemsErr) throw new Error(itemsErr.message);

    // 4. Summaries calculation
    const activeBills = (bills ?? []).filter((b) => b.status !== 'voided');
    const totalRevenue = activeBills.reduce((s, b) => s + Number(b.grand_total), 0);
    const totalProfit = activeBills.reduce((s, b) => s + Number(b.gross_profit), 0);
    const invoicesCount = activeBills.length;

    const totalExpenses = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
    const netProfit = totalProfit - totalExpenses;

    // 5. Product sales aggregation
    const productsMap = new Map<string, { quantity: number; revenue: number }>();
    (billItems ?? []).forEach((item) => {
      const name = item.product_name_snapshot;
      const qty = Number(item.quantity);
      const rev = Number(item.selling_price) * qty;

      const prev = productsMap.get(name) || { quantity: 0, revenue: 0 };
      productsMap.set(name, {
        quantity: prev.quantity + qty,
        revenue: prev.revenue + rev,
      });
    });

    const productSales = Array.from(productsMap.entries())
      .map(([name, stats]) => ({
        name,
        quantity: stats.quantity,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const formattedBills: DayBillInfo[] = (bills ?? []).map((b) => ({
      id: b.id,
      bill_number: b.bill_number,
      bill_date: b.bill_date,
      customer_name: b.customer_name,
      customer_mobile: b.customer_mobile,
      grand_total: Number(b.grand_total),
      gross_profit: Number(b.gross_profit),
      paid_amount: Number(b.paid_amount),
      balance_due: Number(b.balance_due),
      status: b.status,
      employee_name: (b.employees as any)?.name || null,
    }));

    return {
      ok: true,
      data: {
        bills: formattedBills,
        expenses: (expenses ?? []).map((e) => ({
          date: e.date,
          category: e.category,
          description: e.description,
          amount: Number(e.amount),
        })),
        productSales,
        summary: {
          totalRevenue,
          totalProfit,
          totalExpenses,
          netProfit,
          invoicesCount,
        },
      },
    };
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to generate custom range report' };
  }
}
