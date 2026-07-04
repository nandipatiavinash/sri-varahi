const LABELS: Record<string, string> = {
  paid: 'Paid',
  partial: 'Partial',
  credit: 'Credit',
  voided: 'Voided',
};

export function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'paid'
      ? 'badge-paid'
      : status === 'partial'
      ? 'badge-partial'
      : status === 'voided'
      ? 'badge-voided'
      : 'badge-credit';
  return <span className={cls}>{LABELS[status] ?? status}</span>;
}
