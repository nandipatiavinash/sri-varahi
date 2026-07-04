import Link from 'next/link';
import { IndianRupee, TrendingUp, Wallet, AlertCircle, Plus } from 'lucide-react';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export default async function DashboardPage() {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [todayRow, last30, recentBills, expensesThisMonth, outstandingCredit] = await Promise.all([
    supabase.from('v_daily_summary').select('*').eq('business_id', business.id).eq('day', today).maybeSingle(),
    supabase
      .from('v_daily_summary')
      .select('*')
      .eq('business_id', business.id)
      .gte('day', thirtyDaysAgo)
      .order('day', { ascending: true }),
    supabase
      .from('bills')
      .select('id, bill_number, customer_name, grand_total, status, bill_date, created_at')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('expenses')
      .select('amount')
      .eq('business_id', business.id)
      .gte('date', today.slice(0, 7) + '-01'),
    supabase
      .from('bills')
      .select('balance_due')
      .eq('business_id', business.id)
      .in('status', ['credit', 'partial']),
  ]);

  const monthlyExpenseTotal = (expensesThisMonth.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const totalOutstanding = (outstandingCredit.data ?? []).reduce((s, b) => s + Number(b.balance_due), 0);
  const monthProfitSoFar =
    (last30.data ?? [])
      .filter((d) => d.day.slice(0, 7) === today.slice(0, 7))
      .reduce((s, d) => s + Number(d.total_profit ?? 0), 0) - monthlyExpenseTotal;

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Sales"
          value={formatCurrency(todayRow.data?.total_sales)}
          icon={IndianRupee}
          sub={`${todayRow.data?.bill_count ?? 0} bills today`}
        />
        <StatCard
          label="Today's Profit"
          value={formatCurrency(todayRow.data?.total_profit)}
          icon={TrendingUp}
          tone="positive"
        />
        <StatCard
          label="Net Profit (This Month, after expenses)"
          value={formatCurrency(monthProfitSoFar)}
          icon={Wallet}
          tone={monthProfitSoFar >= 0 ? 'positive' : 'negative'}
          sub={`Expenses so far: ${formatCurrency(monthlyExpenseTotal)}`}
        />
        <StatCard
          label="Outstanding Credit"
          value={formatCurrency(totalOutstanding)}
          icon={AlertCircle}
          tone={totalOutstanding > 0 ? 'negative' : 'default'}
        />
      </div>

      <div className="mt-6 card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-700">Sales & Profit — Last 30 Days</h2>
        <SalesTrendChart
          data={(last30.data ?? []).map((d) => ({
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
