import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils/format';
import { PrintButton } from '@/components/reports/PrintButton';

export default async function PrintEmployeePerformancePage() {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: rows } = await supabase
    .from('v_employee_performance')
    .select('*')
    .eq('business_id', business.id)
    .order('total_sales', { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center gap-3.5 border-b border-ink-300 pb-3.5">
        <img src="/logo.png" alt="Logo" className="h-14 w-auto object-contain shrink-0" />
        <div>
          <h1 className="text-base font-bold">Sree Vaaraahii Building Solutions</h1>
          <p className="text-xs text-ink-600">Employee Performance Report</p>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-300 text-left">
            <th className="py-1">Employee</th>
            <th className="py-1 text-right">Bills</th>
            <th className="py-1 text-right">Sales</th>
            <th className="py-1 text-right">Profit</th>
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((r) => (
            <tr key={r.employee_id} className="border-b border-ink-100">
              <td className="py-1">{r.employee_name}</td>
              <td className="py-1 text-right">{r.bill_count}</td>
              <td className="py-1 text-right">{formatCurrency(r.total_sales)}</td>
              <td className="py-1 text-right">{formatCurrency(r.total_profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="no-print mt-8"><PrintButton /></div>
    </div>
  );
}
