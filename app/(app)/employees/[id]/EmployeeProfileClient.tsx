'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IndianRupee,
  Calendar,
  Users,
  Clock,
  ArrowLeft,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils/format';

interface EmployeeProfileClientProps {
  employee: {
    id: string;
    name: string;
    mobile: string | null;
    status: 'active' | 'inactive';
  };
  stats: {
    totalSales: number;
    billsCount: number;
    clientsCount: number;
    avgBill: number;
    daysActive: number;
    estimatedHours: number;
  };
  topProducts: {
    name: string;
    count: number;
  }[];
  monthlyTrend: {
    month: string;
    revenue: number;
  }[];
  bills: any[];
}

export function EmployeeProfileClient({
  employee,
  stats,
  topProducts,
  monthlyTrend,
  bills,
}: EmployeeProfileClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Back button and profile header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.back()}
          className="flex w-fit items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-800"
        >
          <ArrowLeft size={14} /> Back to list
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-lg font-bold text-white shadow-md shadow-brand-500/10">
              {employee.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-900">{employee.name}</h1>
              <p className="text-xs text-ink-500">
                Staff Member · {employee.mobile || 'No mobile linked'}
              </p>
            </div>
          </div>
          <span className={`w-fit px-3 py-1 text-xs font-semibold rounded-full capitalize ${
            employee.status === 'active'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-ink-100 text-ink-600 border border-ink-200'
          }`}>
            {employee.status}
          </span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Total Sales</span>
          <p className="mt-1.5 text-2xl font-bold text-ink-900">{formatCurrency(stats.totalSales)}</p>
          <span className="mt-1 block text-xs text-ink-500 font-medium">All time generated</span>
        </div>
        <div className="card p-5">
          <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Bills Handled</span>
          <p className="mt-1.5 text-2xl font-bold text-ink-900">{stats.billsCount}</p>
          <span className="mt-1 block text-xs text-ink-500 font-medium">Total active invoices</span>
        </div>
        <div className="card p-5">
          <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Clients Served</span>
          <p className="mt-1.5 text-2xl font-bold text-ink-900">{stats.clientsCount}</p>
          <span className="mt-1 block text-xs text-ink-500 font-medium">Unique customers</span>
        </div>
        <div className="card p-5">
          <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Avg Sale Value</span>
          <p className="mt-1.5 text-2xl font-bold text-ink-900">{formatCurrency(stats.avgBill)}</p>
          <span className="mt-1 block text-xs text-ink-500 font-medium">Ticket size average</span>
        </div>
      </div>

      {/* Attendance & Days Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Calendar size={18} />
          </div>
          <div>
            <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Days Active</span>
            <p className="text-lg font-bold text-ink-900">{stats.daysActive} days</p>
            <p className="text-xs text-ink-500 mt-0.5">Days with recorded sales activity</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Estimated Hours</span>
            <p className="text-lg font-bold text-ink-900">{stats.estimatedHours} hrs</p>
            <p className="text-xs text-ink-500 mt-0.5">Calculated at 8 hours per active day</p>
          </div>
        </div>
      </div>

      {/* Charts section: Top Products & Monthly Sales */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Trend Chart */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-700">Monthly Revenue Contribution</h2>
          <div className="h-[240px] w-full">
            {monthlyTrend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-ink-500">
                No monthly sales history found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tickLine={false} style={{ fontSize: 11 }} />
                  <YAxis tickLine={false} style={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val) => [`₹${val}`, 'Sales']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Sold Services Card */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-700">Top Sold Services & Products</h2>
          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={p.name} className="flex items-center justify-between border-b pb-2 last:border-none last:pb-0">
                <div className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-slate-100 text-slate-700' :
                    idx === 2 ? 'bg-amber-50 text-amber-600' :
                    'bg-ink-100 text-ink-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-ink-800 truncate max-w-[200px] sm:max-w-xs">{p.name}</span>
                </div>
                <span className="text-sm font-semibold text-ink-900">{p.count}x sold</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-500">No products sold by this staff member.</p>
            )}
          </div>
        </div>
      </div>

      {/* Invoice History Table */}
      <div className="card">
        <div className="border-b border-ink-100 p-5">
          <h2 className="text-sm font-semibold text-ink-700">Invoice History ({bills.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b bg-ink-50/60 text-xs font-semibold text-ink-500 uppercase tracking-wider">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Invoice No</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Items Sold</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-ink-800">
              {bills.map((b) => {
                const itemsSummary = b.bill_items
                  ?.map((bi: any) => `${bi.product_name_snapshot} (${bi.quantity}x)`)
                  .join(', ') || '—';

                return (
                  <tr key={b.id} className="hover:bg-ink-50/30">
                    <td className="px-5 py-3.5 text-ink-500">{formatDate(b.bill_date)}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/sales/${b.id}`}
                        className="font-bold text-brand-600 hover:underline"
                      >
                        {b.bill_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-ink-900">{b.customer_name}</p>
                      {b.customer_mobile && <p className="text-xs text-ink-500">{b.customer_mobile}</p>}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-ink-600" title={itemsSummary}>
                      {itemsSummary}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold">{formatCurrency(b.grand_total)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                );
              })}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-ink-500">
                    No transactions recorded by this staff member.
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
