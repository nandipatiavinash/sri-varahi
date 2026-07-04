'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentRange = searchParams.get('range') || 'today';
  const currentFrom = searchParams.get('from') || '';
  const currentTo = searchParams.get('to') || '';

  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);

  function applyRange(range: string) {
    if (range === 'custom') return;
    router.push(`/dashboard?range=${range}`);
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (from && to) {
      router.push(`/dashboard?range=custom&from=${from}&to=${to}`);
    }
  }

  return (
    <div className="card mb-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider mr-2">Filter Period:</span>
          {(
            [
              { value: 'today', label: 'Today' },
              { value: '7days', label: 'Last 7 Days' },
              { value: 'month', label: 'This Month' },
              { value: 'custom', label: 'Custom Range' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (opt.value !== 'custom') {
                  applyRange(opt.value);
                } else {
                  router.push(`/dashboard?range=custom${from && to ? `&from=${from}&to=${to}` : ''}`);
                }
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                currentRange === opt.value
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {currentRange === 'custom' && (
          <form onSubmit={handleCustomSubmit} className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              className="input py-1 px-2.5 text-xs w-36"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              required
            />
            <span className="text-xs text-ink-400">to</span>
            <input
              type="date"
              className="input py-1 px-2.5 text-xs w-36"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary py-1 px-3 text-xs">
              Apply
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
