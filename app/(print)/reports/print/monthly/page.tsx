import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils/format';
import { PrintButton } from '@/components/reports/PrintButton';

export default async function PrintMonthlyReportPage() {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: months } = await supabase
    .from('v_monthly_summary')
    .select('*')
    .eq('business_id', business.id)
    .order('month', { ascending: false })
    .limit(12);

  return (
    <div>
      <div className="mb-6 border-b border-ink-300 pb-3">
        <h1 className="text-lg font-bold">{business.name}</h1>
        <p className="text-sm text-ink-600">Monthly Report</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-300 text-left">
            <th className="py-1">Month</th>
            <th className="py-1 text-right">Bills</th>
            <th className="py-1 text-right">Sales</th>
            <th className="py-1 text-right">Profit</th>
          </tr>
        </thead>
        <tbody>
          {(months ?? []).map((m) => (
            <tr key={m.month} className="border-b border-ink-100">
              <td className="py-1">{new Date(m.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</td>
              <td className="py-1 text-right">{m.bill_count}</td>
              <td className="py-1 text-right">{formatCurrency(m.total_sales)}</td>
              <td className="py-1 text-right">{formatCurrency(m.total_profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="no-print mt-8"><PrintButton /></div>
    </div>
  );
}
