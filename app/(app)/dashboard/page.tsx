import Link from 'next/link';
import { IndianRupee, TrendingUp, Wallet, AlertCircle, Plus } from 'lucide-react';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { DashboardFilter } from '@/components/dashboard/DashboardFilter';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const today = new Date().toISOString().slice(0, 10);
  
  // Parse search params
  const params = await searchParams;
  const range = (params.range as string) || 'today';
  const fromParam = params.from as string;
  const toParam = params.to as string;

  let startDate = today;
  let endDate = today;

  if (range === '7days') {
    startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    endDate = today;
  } else if (range === 'month') {
    startDate = today.slice(0, 8) + '01'; // start of current month
    endDate = today;
  } else if (range === 'custom' && fromParam && toParam) {
    startDate = fromParam;
    endDate = toParam;
  }

  const [rangeSummary, recentBills, expensesRange, outstandingCredit] = await Promise.all([
    supabase
      .from('v_daily_summary')
      .select('*')
      .eq('business_id', business.id)
      .gte('day', startDate)
      .lte('day', endDate)
      .order('day', { ascending: true }),
    supabase
      .from('bills')
      .select('id, bill_number, customer_name, grand_total, status, bill_date, created_at')
      .eq('business_id', business.id)
      .gte('bill_date', startDate)
      .lte('bill_date', endDate)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('expenses')
      .select('amount')
      .eq('business_id', business.id)
      .gte('date', startDate)
      .lte('date', endDate),
    supabase
      .from('bills')
      .select('balance_due')
      .eq('business_id', business.id)
      .gte('bill_date', startDate)
      .lte('bill_date', endDate)
      .in('status', ['credit', 'partial']),
  ]);

  const summaryData = rangeSummary.data ?? [];
  const totalSales = summaryData.reduce((s, r) => s + Number(r.total_sales ?? 0), 0);
  const totalProfit = summaryData.reduce((s, r) => s + Number(r.total_profit ?? 0), 0);
  const billCount = summaryData.reduce((s, r) => s + Number(r.bill_count ?? 0), 0);

  const rangeExpenseTotal = (expensesRange.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const totalOutstanding = (outstandingCredit.data ?? []).reduce((s, b) => s + Number(b.balance_due), 0);
  const netProfit = totalProfit - rangeExpenseTotal;

  // Helper labels based on selected range
  let salesLabel = "Today's Sales";
  let profitLabel = "Today's Profit";
  let billsSub = `${billCount} bills today`;
  let expensesSub = `Expenses today: ${formatCurrency(rangeExpenseTotal)}`;

  if (range === '7days') {
    salesLabel = "7 Days Sales";
    profitLabel = "7 Days Profit";
    billsSub = `${billCount} bills (7d)`;
    expensesSub = `Expenses (7d): ${formatCurrency(rangeExpenseTotal)}`;
  } else if (range === 'month') {
    salesLabel = "This Month's Sales";
    profitLabel = "This Month's Profit";
    billsSub = `${billCount} bills (this month)`;
    expensesSub = `Expenses (this month): ${formatCurrency(rangeExpenseTotal)}`;
  } else if (range === 'custom') {
    salesLabel = "Sales (Custom Range)";
    profitLabel = "Profit (Custom Range)";
    billsSub = `${billCount} bills in range`;
    expensesSub = `Expenses in range: ${formatCurrency(rangeExpenseTotal)}`;
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`${business.name} — today, ${formatDate(new Date())}`}
        action={
          <Link href="/sales/new" className="btn-primary">
            <Plus size={16} /> New Sale
          </Link>
        }
      />

      <DashboardFilter />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={salesLabel}
          value={formatCurrency(totalSales)}
          icon={IndianRupee}
          sub={billsSub}
        />
        <StatCard
          label={profitLabel}
          value={formatCurrency(totalProfit)}
          icon={TrendingUp}
          tone="positive"
        />
        <StatCard
          label={range === 'today' ? "Today's Net Profit" : range === '7days' ? "Net Profit (7 Days)" : range === 'month' ? "Net Profit (This Month)" : "Net Profit (Custom Range)"}
          value={formatCurrency(netProfit)}
          icon={Wallet}
          tone={netProfit >= 0 ? 'positive' : 'negative'}
          sub={expensesSub}
        />
        <StatCard
          label="Outstanding Credit"
          value={formatCurrency(totalOutstanding)}
          icon={AlertCircle}
          tone={totalOutstanding > 0 ? 'negative' : 'default'}
        />
      </div>

      <div className="mt-6 card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-700">
          Sales & Profit — {range === 'today' ? 'Today' : range === '7days' ? 'Last 7 Days' : range === 'month' ? 'This Month' : `${startDate} to ${endDate}`}
        </h2>
        <SalesTrendChart
          data={summaryData.map((d) => ({
            day: d.day,
            total_sales: Number(d.total_sales ?? 0),
            total_profit: Number(d.total_profit ?? 0),
          }))}
        />
      </div>

      <div className="mt-6 card">
        <div className="flex items-center justify-between border-b border-ink-100 p-5 pb-4">
          <h2 className="text-sm font-semibold text-ink-700">Recent Bills</h2>
          <Link href="/sales" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-ink-100">
          {(recentBills.data ?? []).map((b) => (
            <Link
              key={b.id}
              href={`/sales/${b.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-ink-50"
            >
              <div>
                <p className="text-sm font-medium text-ink-900">{b.bill_number} — {b.customer_name}</p>
                <p className="text-xs text-ink-500">{formatDate(b.bill_date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{formatCurrency(b.grand_total)}</span>
                <StatusBadge status={b.status} />
              </div>
            </Link>
          ))}
          {(recentBills.data ?? []).length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-ink-500">No bills yet. Create your first sale.</p>
          )}
        </div>
      </div>
    </div>
  );
}
