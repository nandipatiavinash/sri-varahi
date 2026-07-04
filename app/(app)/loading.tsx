'use client';

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-ink-200 border-t-brand-500" />
      <p className="text-sm font-medium text-ink-500 animate-pulse">Loading dashboard and data...</p>
    </div>
  );
}
