import Link from 'next/link';
import { Printer } from 'lucide-react';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatCurrency } from '@/lib/utils/format';

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const now = new Date();
  const defaultFrom = from ?? new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const defaultTo = to ?? now.toISOString().slice(0, 10);

  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const [{ data: bills }, { data: expenses }] = await Promise.all([
    supabase
      .from('bills')
      .select('grand_total, gross_profit, status, bill_date')
      .eq('business_id', business.id)
      .neq('status', 'voided')
      .gte('bill_date', defaultFrom)
      .lte('bill_date', defaultTo),
    supabase
      .from('expenses')
      .select('amount, category, date')
      .eq('business_id', business.id)
      .gte('date', defaultFrom)
      .lte('date', defaultTo),
  ]);

  const totalSales = (bills ?? []).reduce((s, b) => s + Number(b.grand_total), 0);
  const totalGrossProfit = (bills ?? []).reduce((s, b) => s + Number(b.gross_profit), 0);

  const expensesByCategory: Record<string, number> = {};
  for (const e of expenses ?? []) {
    expensesByCategory[e.category] = (expensesByCategory[e.category] ?? 0) + Number(e.amount);
  }
  const totalExpenses = Object.values(expensesByCategory).reduce((s, v) => s + v, 0);
  const netProfit = totalGrossProfit - totalExpenses;

  return (
    <div>
      <PageHeader
        title="Profit & Loss"
        description="Gross profit vs. expenses for the selected period — the real bottom line."
        action={
          <div className="flex items-center gap-2">
            <form className="flex items-center gap-2" action="/reports/profit-loss">
              <input type="date" name="from" defaultValue={defaultFrom} className="input" />
              <span className="text-ink-400">to</span>
              <input type="date" name="to" defaultValue={defaultTo} className="input" />
              <button type="submit" className="btn-secondary">Apply</button>
            </form>
            <Link href={`/reports/print/profit-loss?from=${defaultFrom}&to=${defaultTo}`} target="_blank" className="btn-secondary">
              <Printer size={15} /> Print
            </Link>
          </div>
        }
      />

      <div className="card p-5">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-ink-100">
            <tr><td className="py-2 font-medium">Total Sales</td><td className="py-2 text-right">{formatCurrency(totalSales)}</td></tr>
            <tr><td className="py-2 font-medium">Gross Profit</td><td className="py-2 text-right text-green-700">{formatCurrency(totalGrossProfit)}</td></tr>
            {Object.entries(expensesByCategory).map(([cat, amt]) => (
              <tr key={cat}><td className="py-2 pl-4 text-ink-600">Less: {cat}</td><td className="py-2 text-right text-red-600">-{formatCurrency(amt)}</td></tr>
            ))}
            <tr><td className="py-2 font-medium">Total Expenses</td><td className="py-2 text-right text-red-600">-{formatCurrency(totalExpenses)}</td></tr>
            <tr className="border-t-2 border-ink-300">
              <td className="py-3 text-base font-semibold">Net Profit</td>
              <td className={`py-3 text-right text-base font-semibold ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
