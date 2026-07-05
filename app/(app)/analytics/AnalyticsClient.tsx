'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  TrendingUp,
  Wallet,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Trophy,
  CreditCard,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import * as XLSX from 'xlsx';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { getAnalyticsData, getCustomRangeReport, type AnalyticsData, type DayBillInfo } from '@/actions/analytics';

export function AnalyticsClient() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  
  // Selected date cell for details modal
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Custom Range Report States
  const [reportFrom, setReportFrom] = useState(today.toISOString().slice(0, 10));
  const [reportTo, setReportTo] = useState(today.toISOString().slice(0, 10));
  const [exporting, setExporting] = useState(false);

  async function handleExportExcel() {
    if (!reportFrom || !reportTo) {
      toast.error('Please select both start and end dates');
      return;
    }
    setExporting(true);
    const res = await getCustomRangeReport(reportFrom, reportTo);
    setExporting(false);

    if (!res.ok) {
      toast.error(res.error || 'Failed to export report data');
      return;
    }

    const { bills, expenses, productSales, summary } = res.data;

    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary Stats
      const summaryData = [
        { Metric: 'Report Start Date', Value: formatDate(reportFrom) },
        { Metric: 'Report End Date', Value: formatDate(reportTo) },
        { Metric: 'Total Invoices Count', Value: summary.invoicesCount },
        { Metric: 'Total Revenue (Sales)', Value: summary.totalRevenue },
        { Metric: 'Gross Profit', Value: summary.totalProfit },
        { Metric: 'Total Expenses', Value: summary.totalExpenses },
        { Metric: 'Net Profit', Value: summary.netProfit },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Financial Summary');

      // Sheet 2: Invoices Log
      const invoicesData = bills.map((b) => ({
        'Invoice Number': b.bill_number,
        'Date': b.bill_date,
        'Customer Name': b.customer_name,
        'Customer Mobile': b.customer_mobile || '—',
        'Sales Executive (Staff)': b.employee_name || '—',
        'Grand Total': b.grand_total,
        'Gross Profit': b.gross_profit,
        'Amount Paid': b.paid_amount,
        'Balance Due': b.balance_due,
        'Status': b.status,
      }));
      const wsInvoices = XLSX.utils.json_to_sheet(invoicesData);
      XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoices');

      // Sheet 3: Expenses Log
      const expensesData = expenses.map((e) => ({
        'Date': e.date,
        'Category': e.category,
        'Description': e.description || '—',
        'Amount': e.amount,
      }));
      const wsExpenses = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

      // Sheet 4: Product Sales Log
      const productSalesData = productSales.map((p) => ({
        'Product Name': p.name,
        'Quantity Sold': p.quantity,
        'Total Revenue': p.revenue,
      }));
      const wsProducts = XLSX.utils.json_to_sheet(productSalesData);
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Product Sales');

      XLSX.writeFile(wb, `Business_Analytics_Report_${reportFrom}_to_${reportTo}.xlsx`);

      window.dispatchEvent(
        new CustomEvent('show-success-modal', {
          detail: { message: 'Excel Report exported successfully!' },
        })
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate Excel report');
    }
  }

  const monthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      const res = await getAnalyticsData(monthStr);
      setLoading(false);
      if (res.ok) {
        setData(res.data);
      } else {
        toast.error(res.error || 'Failed to load analytics');
      }
    }
    fetchAnalytics();
  }, [monthStr]);

  function handlePrevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  // Calculate calendar offsets
  const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sunday
  const lastDate = new Date(currentYear, currentMonth, 0).getDate();

  // Calendar cells list
  const cells: { dateStr: string; dayNum: number; isEmpty: boolean }[] = [];
  
  // Add empty slots before first day of month
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ dateStr: '', dayNum: 0, isEmpty: true });
  }

  // Add month days
  for (let d = 1; d <= lastDate; d++) {
    const dStr = `${monthStr}-${d.toString().padStart(2, '0')}`;
    cells.push({ dateStr: dStr, dayNum: d, isEmpty: false });
  }

  // Parse dynamic summaries for charts
  const chartData = data
    ? Object.entries(data.daysData)
        .map(([day, stats]) => ({
          day: day.slice(8), // just show dd
          Sales: stats.sales,
          Profit: stats.profit,
        }))
        .sort((a, b) => a.day.localeCompare(b.day))
    : [];

  // Calculate Today's Revenue and Weekly Revenue from daily summary map
  const todayStr = today.toISOString().slice(0, 10);
  const todayRevenue = data?.daysData[todayStr]?.sales || 0;

  // Last 7 days revenue calculation
  let weeklyRevenue = 0;
  if (data) {
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      weeklyRevenue += data.daysData[d]?.sales || 0;
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Business Analytics"
          description="Revenue growth, payment breakdowns, top sold products, and calendar sales view."
        />
        
        {/* Month Selector Controls */}
        <div className="no-print flex items-center gap-2 self-start rounded-xl bg-white p-1 border shadow-sm sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-50"
            aria-label="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[120px] text-center text-sm font-semibold text-ink-800">
            {monthNames[currentMonth - 1]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-50"
            aria-label="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink-200 border-t-brand-500" />
        </div>
      ) : !data ? (
        <div className="card p-8 text-center text-ink-500">Failed to load monthly data.</div>
      ) : (
        <>
          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="card p-5">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Daily Revenue</span>
              <p className="mt-1.5 text-2xl font-bold text-ink-900">{formatCurrency(todayRevenue)}</p>
              <span className="mt-1 block text-xs text-brand-600 font-medium bg-brand-50/50 py-0.5 px-2 rounded w-fit">Today</span>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Weekly Revenue</span>
              <p className="mt-1.5 text-2xl font-bold text-ink-900">{formatCurrency(weeklyRevenue)}</p>
              <span className="mt-1 block text-xs text-ink-500 font-medium bg-ink-50 py-0.5 px-2 rounded w-fit">Last 7 days</span>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Monthly Revenue</span>
              <p className="mt-1.5 text-2xl font-bold text-ink-900">{formatCurrency(data.monthlySales)}</p>
              <span className="mt-1 block text-xs text-ink-500 font-medium bg-ink-50 py-0.5 px-2 rounded w-fit">Current month</span>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Gross Profit</span>
              <p className="mt-1.5 text-2xl font-bold text-ink-900">{formatCurrency(data.monthlyProfit)}</p>
              <span className="mt-1 block text-xs text-emerald-600 font-medium bg-emerald-50 py-0.5 px-2 rounded w-fit">Current month</span>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Total Expenses</span>
              <p className="mt-1.5 text-2xl font-bold text-ink-900">{formatCurrency(data.monthlyExpenses)}</p>
              <span className="mt-1 block text-xs text-red-600 font-medium bg-red-50 py-0.5 px-2 rounded w-fit">Current month</span>
            </div>
            <div className="card p-5">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Net Profit</span>
              <p className="mt-1.5 text-2xl font-bold text-ink-900">{formatCurrency(data.monthlyNetProfit)}</p>
              <span className="mt-1 block text-xs text-sky-600 font-medium bg-sky-50 py-0.5 px-2 rounded w-fit">Current month</span>
            </div>
            <div className="card p-5 col-span-2 lg:col-span-3">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Average Bill</span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <p className="text-2xl font-bold text-ink-900">{formatCurrency(data.averageBill)}</p>
                <span className="text-xs text-ink-500 font-medium">
                  across {data.totalInvoicesCount} invoices
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Trend Area Chart */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-ink-700">Revenue Trend (Daily Sales vs Profit)</h2>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tickLine={false} style={{ fontSize: 11 }} />
                  <YAxis tickLine={false} style={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val) => [`₹${val}`, '']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  />
                  <Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="Profit" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Payment Breakdown Card */}
            <div className="card p-5 flex flex-col justify-between">
              <div>
                <h2 className="mb-4 text-sm font-semibold text-ink-700">Payment Breakdown</h2>
                <div className="space-y-4">
                  {Object.entries(data.paymentBreakdown).map(([method, val]) => {
                    const total = Object.values(data.paymentBreakdown).reduce((s, v) => s + v, 0);
                    const percentage = total > 0 ? (val / total) * 100 : 0;
                    const colors = {
                      upi: 'bg-indigo-600',
                      cash: 'bg-green-600',
                      bank: 'bg-blue-600',
                    };
                    return (
                      <div key={method}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="font-semibold capitalize text-ink-800">{method}</span>
                          <span className="text-ink-600">{formatCurrency(val)} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-ink-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[method as 'upi'|'cash'|'bank']} rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-6 border-t pt-4 flex items-center justify-between text-sm font-semibold text-ink-800">
                <span>Total Collected:</span>
                <span>
                  {formatCurrency(
                    Object.values(data.paymentBreakdown).reduce((s, v) => s + v, 0)
                  )}
                </span>
              </div>
            </div>

            {/* Top Products Leaderboard Card */}
            <div className="card p-5">
              <h2 className="mb-4 text-sm font-semibold text-ink-700">Top Products & Services</h2>
              <div className="space-y-3">
                {data.topProducts.map((p, idx) => (
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
                    <div className="text-right text-sm">
                      <p className="font-semibold text-ink-900">{formatCurrency(p.revenue)}</p>
                      <p className="text-xs text-ink-500">{p.quantity} sold</p>
                    </div>
                  </div>
                ))}
                {data.topProducts.length === 0 && (
                  <p className="py-8 text-center text-sm text-ink-500">No items sold this month.</p>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Sales Calendar Card */}
          <div className="card p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-ink-700">Sales Calendar</h2>
                <p className="text-xs text-ink-500">Click any date cell to view daily invoices and export details.</p>
              </div>
              <div className="text-sm font-semibold text-brand-600">
                Monthly sales: {formatCurrency(data.monthlySales)}
              </div>
            </div>

            {/* Calendar Grid Header */}
            <div className="grid grid-cols-7 gap-1 border-b pb-2 mb-2 text-center text-xs font-semibold text-ink-500 uppercase tracking-wide">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Calendar Grid Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((cell, idx) => {
                if (cell.isEmpty) {
                  return <div key={`empty-${idx}`} className="aspect-[4/3] bg-ink-50/20 rounded-xl" />;
                }

                const dayData = data.daysData[cell.dateStr];
                const revenue = dayData?.sales || 0;
                const hasSales = revenue > 0;

                return (
                  <button
                    key={cell.dateStr}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`aspect-[4/3] rounded-xl border p-2 flex flex-col justify-between text-left transition-all group ${
                      hasSales
                        ? 'border-green-100 bg-green-50/40 hover:bg-green-50 hover:border-green-300'
                        : 'border-ink-100 bg-white hover:bg-ink-50'
                    }`}
                  >
                    {/* Day Number */}
                    <span className="text-xs font-semibold text-ink-600">{cell.dayNum.toString().padStart(2, '0')}</span>
                    
                    {/* Revenue Display (Hidden on mobile grid, shown on dot) */}
                    <div className="w-full">
                      {hasSales ? (
                        <>
                          {/* Desktop text */}
                          <span className="hidden md:block text-xs font-bold text-green-700 truncate">
                            {formatCurrency(revenue)}
                          </span>
                          {/* Mobile Dot */}
                          <span className="block md:hidden h-1.5 w-1.5 bg-green-600 rounded-full mx-auto" />
                        </>
                      ) : (
                        <span className="hidden md:block text-xs text-ink-400">—</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Range Export/Print card */}
          <div className="card p-5 mt-6 no-print">
            <h2 className="text-sm font-semibold text-ink-700 mb-1">Export Custom Date Range Report</h2>
            <p className="text-xs text-ink-500 mb-4">Select a custom date range to download the Excel workbook or print/save the detailed PDF report.</p>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="label text-xs" htmlFor="report-from">Start Date</label>
                <input
                  id="report-from"
                  type="date"
                  className="input py-1.5 px-3 text-xs w-40"
                  value={reportFrom}
                  onChange={(e) => setReportFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="label text-xs" htmlFor="report-to">End Date</label>
                <input
                  id="report-to"
                  type="date"
                  className="input py-1.5 px-3 text-xs w-40"
                  value={reportTo}
                  onChange={(e) => setReportTo(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  disabled={exporting}
                  onClick={handleExportExcel}
                  className="btn bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1.5 text-xs font-semibold py-1.5 px-4 rounded-lg disabled:opacity-50"
                >
                  <Download size={14} /> {exporting ? 'Exporting...' : 'Download Excel'}
                </button>
                <Link
                  href={`/reports/print/analytics?from=${reportFrom}&to=${reportTo}`}
                  target="_blank"
                  className="btn-primary py-1.5 px-4 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                >
                  Print / Save PDF
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Date Details Modal */}
      {selectedDate && data && (
        <DateDetailsModal
          dateStr={selectedDate}
          dayInfo={data.daysData[selectedDate] || { sales: 0, profit: 0, billsCount: 0, bills: [] }}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

function DateDetailsModal({
  dateStr,
  dayInfo,
  onClose,
}: {
  dateStr: string;
  dayInfo: { sales: number; profit: number; billsCount: number; bills: DayBillInfo[] };
  onClose: () => void;
}) {
  
  // Calculate margins for the day
  const totalRevenue = dayInfo.sales;
  const totalProfit = dayInfo.profit;
  const totalCost = totalRevenue - totalProfit;

  // Handle XLS Export of the Day's invoices
  function handleExportDay() {
    if (dayInfo.bills.length === 0) {
      toast.error('No invoices to export for this date');
      return;
    }

    try {
      const exportData = dayInfo.bills.map((b) => ({
        'Invoice Number': b.bill_number,
        'Customer Name': b.customer_name,
        'Customer Mobile': b.customer_mobile || '—',
        'Sales Executive (Staff)': b.employee_name || '—',
        'Grand Total': b.grand_total,
        'Gross Profit': b.gross_profit,
        'Amount Paid': b.paid_amount,
        'Balance Due': b.balance_due,
        'Status': b.status,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Daily Sales');
      
      XLSX.writeFile(wb, `Sales_Report_${dateStr}.xlsx`);
      toast.success('Day-wise Excel file downloaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export daily sales');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[85vh] overflow-hidden border">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-ink-900">{formatDate(dateStr)}</h3>
            <p className="text-xs text-ink-500">Daily transaction summary and invoice log</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportDay}
              className="btn bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg"
            >
              <Download size={14} /> Export XLS
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Day metrics summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="bg-ink-50/50 p-3 rounded-xl">
              <span className="text-xs text-ink-500">Total Revenue</span>
              <p className="text-lg font-bold text-ink-900 mt-0.5">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-ink-50/50 p-3 rounded-xl">
              <span className="text-xs text-ink-500">Purchase Cost</span>
              <p className="text-lg font-bold text-ink-900 mt-0.5">{formatCurrency(totalCost)}</p>
            </div>
            <div className="bg-ink-50/50 p-3 rounded-xl">
              <span className="text-xs text-ink-500">Gross Profit</span>
              <p className={`text-lg font-bold mt-0.5 ${totalProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {formatCurrency(totalProfit)}
              </p>
            </div>
            <div className="bg-ink-50/50 p-3 rounded-xl">
              <span className="text-xs text-ink-500">Invoices Generated</span>
              <p className="text-lg font-bold text-ink-900 mt-0.5">{dayInfo.billsCount} bills</p>
            </div>
          </div>

          {/* Invoices List Table */}
          <div>
            <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wide mb-2.5">Invoices Log</h4>
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b bg-ink-50/60 text-xs font-semibold text-ink-500 uppercase tracking-wider">
                    <th className="px-4 py-2.5">Bill Number</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Staff Executive</th>
                    <th className="px-4 py-2.5 text-right">Grand Total</th>
                    <th className="px-4 py-2.5 text-right">Profit</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-ink-800">
                  {dayInfo.bills.map((b) => (
                    <tr key={b.id} className="hover:bg-ink-50/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/sales/${b.id}`}
                          onClick={onClose}
                          className="font-bold text-brand-600 hover:underline"
                        >
                          {b.bill_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink-900">{b.customer_name}</p>
                        {b.customer_mobile && <p className="text-xs text-ink-500">{b.customer_mobile}</p>}
                      </td>
                      <td className="px-4 py-3 text-ink-600">{b.employee_name || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(b.grand_total)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${b.gross_profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {b.status !== 'voided' ? formatCurrency(b.gross_profit) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                  {dayInfo.bills.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                        No transactions recorded on this date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
