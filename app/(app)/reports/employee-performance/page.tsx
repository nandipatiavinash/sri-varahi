import Link from 'next/link';
import { Printer, Trophy } from 'lucide-react';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatCurrency } from '@/lib/utils/format';

export default async function EmployeePerformancePage() {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: rows } = await supabase
    .from('v_employee_performance')
    .select('*')
    .eq('business_id', business.id)
    .order('total_sales', { ascending: false });

  return (
    <div>
      <PageHeader
        title="Employee Performance"
        description="Leaderboard of sales and profit generated per employee, all time."
        action={
          <Link href="/reports/print/employee-performance" target="_blank" className="btn-secondary">
            <Printer size={15} /> Print
          </Link>
        }
      />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="px-4 py-2">Rank</th>
              <th className="px-4 py-2">Employee</th>
              <th className="px-4 py-2 text-right">Bills</th>
              <th className="px-4 py-2 text-right">Sales</th>
              <th className="px-4 py-2 text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(rows ?? []).map((r, i) => (
              <tr key={r.employee_id}>
                <td className="px-4 py-2.5">
                  {i === 0 ? <Trophy size={15} className="inline text-amber-500" /> : `#${i + 1}`}
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/employees/${r.employee_id}`}
                    prefetch={true}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {r.employee_name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right">{r.bill_count}</td>
                <td className="px-4 py-2.5 text-right">{formatCurrency(r.total_sales)}</td>
                <td className={`px-4 py-2.5 text-right ${r.total_profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(r.total_profit)}</td>
              </tr>
            ))}
            {(rows ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-500">No sales attributed to employees yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
