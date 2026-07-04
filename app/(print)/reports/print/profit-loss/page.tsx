import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { PrintButton } from '@/components/reports/PrintButton';

export default async function PrintProfitLossPage({
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
      .select('grand_total, gross_profit')
      .eq('business_id', business.id)
      .neq('status', 'voided')
      .gte('bill_date', defaultFrom)
      .lte('bill_date', defaultTo),
    supabase.from('expenses').select('amount, category').eq('business_id', business.id).gte('date', defaultFrom).lte('date', defaultTo),
  ]);

  const totalSales = (bills ?? []).reduce((s, b) => s + Number(b.grand_total), 0);
  const totalGrossProfit = (bills ?? []).reduce((s, b) => s + Number(b.gross_profit), 0);
  const expensesByCategory: Record<string, number> = {};
  for (const e of expenses ?? []) expensesByCategory[e.category] = (expensesByCategory[e.category] ?? 0) + Number(e.amount);
  const totalExpenses = Object.values(expensesByCategory).reduce((s, v) => s + v, 0);
  const netProfit = totalGrossProfit - totalExpenses;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3.5 border-b border-ink-300 pb-3.5">
        <img src="/logo.png" alt="Logo" className="h-14 w-auto object-contain shrink-0" />
        <div>
          <h1 className="text-base font-bold">Sree Vaaraahii Building Solutions</h1>
          <p className="text-xs text-ink-600">Profit &amp; Loss — {formatDate(defaultFrom)} to {formatDate(defaultTo)}</p>
        </div>
      </div>
      <table className="w-full text-sm">
        <tbody>
          <tr><td className="py-1">Total Sales</td><td className="py-1 text-right">{formatCurrency(totalSales)}</td></tr>
          <tr><td className="py-1">Gross Profit</td><td className="py-1 text-right">{formatCurrency(totalGrossProfit)}</td></tr>
          {Object.entries(expensesByCategory).map(([cat, amt]) => (
            <tr key={cat}><td className="py-1 pl-4">Less: {cat}</td><td className="py-1 text-right">-{formatCurrency(amt)}</td></tr>
          ))}
          <tr className="border-t border-ink-300 font-semibold"><td className="py-1">Net Profit</td><td className="py-1 text-right">{formatCurrency(netProfit)}</td></tr>
        </tbody>
      </table>
      <div className="no-print mt-8"><PrintButton /></div>
    </div>
  );
}
