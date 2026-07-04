import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  sub,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: 'default' | 'positive' | 'negative';
  sub?: string;
}) {
  const toneCls =
    tone === 'positive' ? 'text-green-700 bg-green-50' : tone === 'negative' ? 'text-red-700 bg-red-50' : 'text-brand-700 bg-brand-50';

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneCls}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-500">{sub}</p>}
    </div>
  );
}
