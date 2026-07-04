import Link from 'next/link';
import { Printer } from 'lucide-react';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatCurrency } from '@/lib/utils/format';

export default async function MonthlyReportPage() {
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
      <PageHeader
        title="Monthly Report"
        description="Month-by-month sales and profit trend, most recent first."
        action={
          <Link href="/reports/print/monthly" target="_blank" className="btn-secondary">
            <Printer size={15} /> Print
          </Link>
        }
      />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="px-4 py-2">Month</th>
              <th className="px-4 py-2 text-right">Bills</th>
              <th className="px-4 py-2 text-right">Sales</th>
              <th className="px-4 py-2 text-right">Gross Profit</th>
              <th className="px-4 py-2 text-right">Collected</th>
              <th className="px-4 py-2 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(months ?? []).map((m) => (
              <tr key={m.month}>
                <td className="px-4 py-2.5 font-medium">
                  {new Date(m.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </td>
                <td className="px-4 py-2.5 text-right">{m.bill_count}</td>
                <td className="px-4 py-2.5 text-right">{formatCurrency(m.total_sales)}</td>
                <td className="px-4 py-2.5 text-right text-green-700">{formatCurrency(m.total_profit)}</td>
                <td className="px-4 py-2.5 text-right">{formatCurrency(m.total_collected)}</td>
                <td className="px-4 py-2.5 text-right text-red-600">{formatCurrency(m.total_outstanding)}</td>
              </tr>
            ))}
            {(months ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-500">No data yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
