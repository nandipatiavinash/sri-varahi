import Link from 'next/link';
import { Printer } from 'lucide-react';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, todayISO } from '@/lib/utils/format';
import { ReportDatePicker } from '@/components/reports/ReportDatePicker';

export default async function DailyReportPage({
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
      .select('id, bill_number, customer_name, grand_total, gross_profit, status')
      .eq('business_id', business.id)
      .eq('bill_date', day)
      .order('created_at'),
    supabase.from('expenses').select('amount, category, description').eq('business_id', business.id).eq('date', day),
  ]);

  const expenseTotal = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <PageHeader
        title="Daily EOD Report"
        description={formatDate(day)}
        action={
          <div className="flex items-center gap-2">
            <ReportDatePicker basePath="/reports/daily" date={day} />
            <Link href={`/reports/print/daily?date=${day}`} target="_blank" className="btn-secondary">
              <Printer size={15} /> Print
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4"><p className="text-xs text-ink-500">Bills</p><p className="text-lg font-semibold">{summary?.bill_count ?? 0}</p></div>
        <div className="card p-4"><p className="text-xs text-ink-500">Total Sales</p><p className="text-lg font-semibold">{formatCurrency(summary?.total_sales)}</p></div>
        <div className="card p-4"><p className="text-xs text-ink-500">Gross Profit</p><p className={`text-lg font-semibold ${(summary?.total_profit ?? 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(summary?.total_profit)}</p></div>
        <div className="card p-4"><p className="text-xs text-ink-500">Net Profit (after expenses)</p><p className={`text-lg font-semibold ${(Number(summary?.total_profit ?? 0) - expenseTotal) >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(Number(summary?.total_profit ?? 0) - expenseTotal)}</p></div>
      </div>

      <div className="card mt-5 overflow-hidden">
        <div className="border-b border-ink-100 p-4"><h3 className="text-sm font-semibold text-ink-700">Bills</h3></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs uppercase text-ink-500"><th className="px-4 py-2">Bill #</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2 text-right">Profit</th><th className="px-4 py-2">Status</th></tr></thead>
          <tbody className="divide-y divide-ink-100">
            {(bills ?? []).map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-2.5"><Link href={`/sales/${b.id}`} className="text-brand-700 hover:underline">{b.bill_number}</Link></td>
                <td className="px-4 py-2.5">{b.customer_name}</td>
                <td className="px-4 py-2.5 text-right">{formatCurrency(b.grand_total)}</td>
                <td className={`px-4 py-2.5 text-right ${(b.gross_profit ?? 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(b.gross_profit)}</td>
                <td className="px-4 py-2.5"><StatusBadge status={b.status} /></td>
              </tr>
            ))}
            {(bills ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-500">No bills on this day.</td></tr>}
          </tbody>
        </table>
      </div>

      {(expenses ?? []).length > 0 && (
        <div className="card mt-5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-ink-700">Expenses ({formatCurrency(expenseTotal)})</h3>
          <ul className="space-y-1 text-sm">
            {(expenses ?? []).map((e, i) => (
              <li key={i} className="flex justify-between"><span>{e.category} {e.description ? `— ${e.description}` : ''}</span><span>{formatCurrency(e.amount)}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
