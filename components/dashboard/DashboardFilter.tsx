'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentRange = searchParams.get('range') || 'today';
  const currentFrom = searchParams.get('from') || '';
  const currentTo = searchParams.get('to') || '';

  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);
  
  const [loadingRange, setLoadingRange] = useState<string | null>(null);
  const [customLoading, setCustomLoading] = useState(false);

  useEffect(() => {
    // Reset all loading states once URL parameters update on the client
    setLoadingRange(null);
    setCustomLoading(false);
  }, [searchParams]);

  function applyRange(range: string) {
    if (range === 'custom') return;
    setLoadingRange(range);
    router.push(`/dashboard?range=${range}`);
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (from && to) {
      setCustomLoading(true);
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
          ).map((opt) => {
            const isLoading = loadingRange === opt.value;
            const isSelected = currentRange === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                disabled={loadingRange !== null || customLoading}
                onClick={() => {
                  if (opt.value !== 'custom') {
                    applyRange(opt.value);
                  } else {
                    setLoadingRange('custom');
                    router.push(`/dashboard?range=custom${from && to ? `&from=${from}&to=${to}` : ''}`);
                  }
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 inline-flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                } disabled:opacity-75`}
              >
                {isLoading && (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {currentRange === 'custom' && (
          <form onSubmit={handleCustomSubmit} className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              className="input py-1 px-2.5 text-xs w-36"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              required
              disabled={loadingRange !== null || customLoading}
            />
            <span className="text-xs text-ink-400">to</span>
            <input
              type="date"
              className="input py-1 px-2.5 text-xs w-36"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
              disabled={loadingRange !== null || customLoading}
            />
            <button
              type="submit"
              disabled={loadingRange !== null || customLoading}
              className="btn-primary py-1 px-3 text-xs inline-flex items-center gap-1.5"
            >
              {customLoading && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Apply
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
