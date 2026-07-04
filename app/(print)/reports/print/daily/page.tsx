import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { formatCurrency, formatDate, todayISO } from '@/lib/utils/format';
import { PrintButton } from '@/components/reports/PrintButton';

export default async function PrintDailyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const day = date ?? todayISO();
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const [{ data: summary }, { data: bills }, { data: expenses }] = await Promise.all([
    supabase.from('v_daily_summary').select('*').eq('business_id', business.id).eq('day', day).maybeSingle(),
    supabase
      .from('bills')
      .select('bill_number, customer_name, grand_total, gross_profit, status')
      .eq('business_id', business.id)
      .eq('bill_date', day),
    supabase.from('expenses').select('amount, category').eq('business_id', business.id).eq('date', day),
  ]);
  const expenseTotal = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <div className="mb-6 border-b border-ink-300 pb-3">
        <h1 className="text-lg font-bold">{business.name}</h1>
        <p className="text-sm text-ink-600">Daily EOD Report — {formatDate(day)}</p>
      </div>

      <table className="mb-4 w-full text-sm">
        <tbody>
          <tr><td className="py-1">Total Bills</td><td className="py-1 text-right">{summary?.bill_count ?? 0}</td></tr>
          <tr><td className="py-1">Total Sales</td><td className="py-1 text-right">{formatCurrency(summary?.total_sales)}</td></tr>
          <tr><td className="py-1">Gross Profit</td><td className="py-1 text-right">{formatCurrency(summary?.total_profit)}</td></tr>
          <tr><td className="py-1">Expenses</td><td className="py-1 text-right">-{formatCurrency(expenseTotal)}</td></tr>
          <tr className="border-t border-ink-300 font-semibold"><td className="py-1">Net Profit</td><td className="py-1 text-right">{formatCurrency(Number(summary?.total_profit ?? 0) - expenseTotal)}</td></tr>
        </tbody>
      </table>

      <table className="w-full text-sm">
        <thead><tr className="border-b border-ink-300 text-left"><th className="py-1">Bill #</th><th className="py-1">Customer</th><th className="py-1 text-right">Total</th><th className="py-1">Status</th></tr></thead>
        <tbody>
          {(bills ?? []).map((b, i) => (
            <tr key={i} className="border-b border-ink-100">
              <td className="py-1">{b.bill_number}</td>
              <td className="py-1">{b.customer_name}</td>
              <td className="py-1 text-right">{formatCurrency(b.grand_total)}</td>
              <td className="py-1 capitalize">{b.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="no-print mt-8"><PrintButton /></div>
    </div>
  );
}
