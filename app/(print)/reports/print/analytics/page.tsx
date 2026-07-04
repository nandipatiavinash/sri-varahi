import { redirect } from 'next/navigation';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { getCustomRangeReport } from '@/actions/analytics';
import { PrintTrigger } from '@/components/ui/PrintTrigger';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export default async function AnalyticsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  // Parse custom range parameters
  const params = await searchParams;
  const from = params.from as string;
  const to = params.to as string;

  if (!from || !to) {
    redirect('/analytics');
  }

  const res = await getCustomRangeReport(from, to);
  if (!res.ok) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        Failed to load report data: {res.error || 'Unknown error'}
      </div>
    );
  }

  const { bills, expenses, productSales, summary } = res.data;

  return (
    <div className="space-y-8 text-ink-900 bg-white p-2">
      <PrintTrigger />

      {/* Report Header */}
      <div className="flex items-center gap-4 border-b-2 border-ink-900 pb-4 text-left">
        <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain shrink-0" />
        <div>
          <h1 className="text-lg font-bold uppercase tracking-wide">Sree Vaaraahii Building Solutions</h1>
          <p className="text-sm text-ink-600">Business Analytics Summary Report</p>
          <p className="text-xs font-semibold text-ink-700 mt-1">
            Period: {formatDate(from)} to {formatDate(to)}
          </p>
        </div>
      </div>

      {/* KPI Financial Summary block */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider border-b pb-1.5 mb-3 text-ink-800">
          Financial Summary
        </h2>
        <div className="grid grid-cols-3 gap-4 border p-4 rounded-xl bg-ink-50/20">
          <div>
            <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">Total Sales</span>
            <p className="text-lg font-bold text-ink-900 mt-0.5">{formatCurrency(summary.totalRevenue)}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">Gross Profit</span>
            <p className={`text-lg font-bold mt-0.5 ${summary.totalProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {formatCurrency(summary.totalProfit)}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">Total Expenses</span>
            <p className="text-lg font-bold text-red-600 mt-0.5">-{formatCurrency(summary.totalExpenses)}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">Net Profit</span>
            <p className={`text-lg font-bold mt-0.5 ${summary.netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {formatCurrency(summary.netProfit)}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">Total Invoices</span>
            <p className="text-lg font-bold text-ink-900 mt-0.5">{summary.invoicesCount} bills</p>
          </div>
        </div>
      </div>

      {/* Product sales statistics */}
      <div className="page-break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b pb-1.5 mb-3 text-ink-800">
          Items & Services Sold
        </h2>
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b bg-ink-50 font-semibold text-ink-700">
                <th className="px-4 py-2">Product Name</th>
                <th className="px-4 py-2 text-right">Quantity Sold</th>
                <th className="px-4 py-2 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {productSales.map((p) => (
                <tr key={p.name}>
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2 text-right font-semibold">{p.quantity}</td>
                  <td className="px-4 py-2 text-right font-bold">{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
              {productSales.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-ink-500">
                    No items sold in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice list */}
      <div className="page-break-before-always">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b pb-1.5 mb-3 text-ink-800">
          Transactions Log
        </h2>
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b bg-ink-50 font-semibold text-ink-700">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Bill No</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Staff Executive</th>
                <th className="px-4 py-2 text-right">Grand Total</th>
                <th className="px-4 py-2 text-right">Profit</th>
                <th className="px-4 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bills.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2 text-ink-500">{formatDate(b.bill_date)}</td>
                  <td className="px-4 py-2 font-bold">{b.bill_number}</td>
                  <td className="px-4 py-2 font-medium">{b.customer_name}</td>
                  <td className="px-4 py-2">{b.employee_name || '—'}</td>
                  <td className="px-4 py-2 text-right font-bold">{formatCurrency(b.grand_total)}</td>
                  <td className={`px-4 py-2 text-right font-medium ${b.gross_profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {b.status !== 'voided' ? formatCurrency(b.gross_profit) : '—'}
                  </td>
                  <td className="px-4 py-2 text-center capitalize">{b.status}</td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-ink-500">
                    No transactions in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses list */}
      <div className="page-break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b pb-1.5 mb-3 text-ink-800">
          Expenses Log
        </h2>
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b bg-ink-50 font-semibold text-ink-700">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {expenses.map((e, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-ink-500">{formatDate(e.date)}</td>
                  <td className="px-4 py-2 font-medium capitalize">{e.category}</td>
                  <td className="px-4 py-2 text-ink-600">{e.description || '—'}</td>
                  <td className="px-4 py-2 text-right font-bold text-red-600">-{formatCurrency(e.amount)}</td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-ink-500">
                    No expenses recorded in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
