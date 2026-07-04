'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  PackageSearch,
  Users,
  Wallet,
  Landmark,
  CreditCard,
  BarChart3,
  Settings,
  Search,
  LogOut,
} from 'lucide-react';
import { signOut } from '@/actions/auth';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales', label: 'Sales / Billing', icon: Receipt },
  { href: '/advance-orders', label: 'Advance Orders', icon: Landmark },
  { href: '/credit-customers', label: 'Credit Customers', icon: CreditCard },
  { href: '/expenses', label: 'Expenses', icon: Wallet },
  { href: '/products', label: 'Products', icon: PackageSearch },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname();

  return (
    <aside className="no-print flex h-screen w-64 flex-col border-r border-ink-100 bg-white">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
          SV
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{businessName}</p>
          <p className="text-xs text-ink-500">Sales & Profit</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
      <form action={signOut} className="border-t border-ink-100 p-2">
        <button type="submit" className="btn-ghost w-full justify-start">
          <LogOut size={17} />
          Sign out
        </button>
      </form>
    </aside>
  );
}
