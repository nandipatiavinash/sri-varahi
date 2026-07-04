import Link from 'next/link';
import { CalendarDays, CalendarRange, Trophy, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ExcelExporter } from '@/components/reports/ExcelExporter';

const REPORTS = [
  { href: '/reports/daily', label: 'Daily EOD Report', description: 'End-of-day sales, profit, payments breakdown for any single day.', icon: CalendarDays },
  { href: '/reports/monthly', label: 'Monthly Report', description: 'Month-by-month sales and profit trend.', icon: CalendarRange },
  { href: '/reports/employee-performance', label: 'Employee Performance', description: 'Leaderboard of sales and profit generated per employee.', icon: Trophy },
  { href: '/reports/profit-loss', label: 'Profit & Loss', description: 'Gross profit vs. expenses — true net profit over any period.', icon: TrendingUp },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <PageHeader title="Reports" description="Screen view with a print-optimized A4 layout for each." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {REPORTS.map(({ href, label, description, icon: Icon }) => (
            <Link key={href} href={href} className="card flex items-start gap-4 p-5 hover:border-brand-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon size={18} />
              </div>
              <div>
                <p className="font-medium text-ink-900">{label}</p>
                <p className="mt-1 text-sm text-ink-500">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <ExcelExporter />
    </div>
  );
}
