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
  X,
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
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  businessName,
  isOpen,
  onClose,
}: {
  businessName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`no-print fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-ink-100 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-ink-50 lg:border-none">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-ink-900 uppercase tracking-wide">Sree Vaaraahii</p>
            <p className="text-[10px] text-ink-500">Building Solutions</p>
          </div>
        </div>
        
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-ink-500 hover:bg-ink-100 lg:hidden"
          aria-label="Close Sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-0.5 px-2 py-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              onClick={onClose}
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

      {/* Sign Out Action */}
      <form action={signOut} className="border-t border-ink-100 p-2">
        <button type="submit" className="btn-ghost w-full justify-start">
          <LogOut size={17} />
          Sign out
        </button>
      </form>
    </aside>
  );
}
