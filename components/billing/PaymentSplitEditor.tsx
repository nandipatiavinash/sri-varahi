'use client';

import { Trash2, Plus } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { BillFormValues } from '@/lib/validations/bill';
import { formatCurrency } from '@/lib/utils/format';

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'advance', label: 'Advance (from order)' },
  { value: 'credit', label: 'Credit (unpaid)' },
] as const;

export function PaymentSplitEditor({
  form,
  grandTotal,
}: {
  form: UseFormReturn<BillFormValues>;
  grandTotal: number;
}) {
  const { watch, setValue } = form;
  const splits = watch('paymentSplits');

  const totalEntered = splits.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const remaining = Math.max(0, grandTotal - totalEntered);

  function update(index: number, patch: Partial<BillFormValues['paymentSplits'][number]>) {
    const next = [...splits];
    next[index] = { ...next[index], ...patch };
    setValue('paymentSplits', next, { shouldValidate: true, shouldDirty: true });
  }

  function addRow() {
    setValue('paymentSplits', [...splits, { method: 'cash', amount: remaining || 0 }]);
  }

  function removeRow(index: number) {
    if (splits.length === 1) return;
    setValue('paymentSplits', splits.filter((_, i) => i !== index));
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-700">Payment Split</h3>
        <button type="button" onClick={addRow} className="btn-secondary px-3 py-1.5 text-xs">
          <Plus size={14} /> Add split
        </button>
      </div>
      <div className="space-y-2">
        {splits.map((split, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              className="input"
              value={split.method}
              onChange={(e) => update(index, { method: e.target.value as any })}
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <input
              type="number"
              step="1"
              min="0"
              className="input"
              value={split.amount}
              onChange={(e) => update(index, { amount: Number(e.target.value) })}
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="text-ink-400 hover:text-red-600"
              disabled={splits.length === 1}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between border-t border-ink-100 pt-3 text-sm">
        <span className="text-ink-500">Entered: {formatCurrency(totalEntered)}</span>
        <span className={remaining > 0 ? 'font-medium text-amber-600' : 'font-medium text-green-700'}>
          {remaining > 0 ? `Remaining (will be credit): ${formatCurrency(remaining)}` : 'Fully paid'}
        </span>
      </div>
    </div>
  );
}
