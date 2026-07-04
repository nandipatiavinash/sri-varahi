'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatCurrency, formatDate, todayISO } from '@/lib/utils/format';
import { createExpense, updateExpense, deleteExpense } from '@/actions/expenses';
import { EXPENSE_CATEGORIES, type ExpenseFormValues } from '@/lib/validations/expense';
import { triggerSuccessModal } from '@/components/ui/SuccessModal';

interface ExpenseRow {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string | null;
}

export function ExpensesClient({ initialExpenses }: { initialExpenses: ExpenseRow[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [editing, setEditing] = useState<ExpenseRow | 'new' | null>(null);

  function refresh() {
    window.location.reload();
  }

  async function handleDelete(id: string) {
    const result = await deleteExpense(id);
    if (!result.ok) return toast.error(result.error);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    triggerSuccessModal('Expense Deleted Successfully!');
  }

  const columns: ColumnDef<ExpenseRow>[] = [
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => formatDate(row.original.date) },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.original.description || '—' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => formatCurrency(row.original.amount) },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button onClick={() => setEditing(row.original)} className="text-ink-400 hover:text-brand-600">
            <Pencil size={15} />
          </button>
          <button onClick={() => handleDelete(row.original.id)} className="text-ink-400 hover:text-red-600">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        description={`Total recorded: ${formatCurrency(total)}. Feeds directly into the net profit engine.`}
        action={
          <button onClick={() => setEditing('new')} className="btn-primary">
            <Plus size={16} /> Add Expense
          </button>
        }
      />
      <DataTable columns={columns} data={expenses} searchPlaceholder="Search expenses…" emptyMessage="No expenses yet." />

      {editing && (
        <ExpenseModal expense={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={refresh} />
      )}
    </div>
  );
}

function ExpenseModal({
  expense,
  onClose,
  onSaved,
}: {
  expense: ExpenseRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ExpenseFormValues>({
    date: expense?.date ?? todayISO(),
    category: (expense?.category as any) ?? 'Miscellaneous',
    amount: expense?.amount ?? 0,
    description: expense?.description ?? '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = expense ? await updateExpense(expense.id, form) : await createExpense(form);
    setSaving(false);
    if (!result.ok) return toast.error(result.error);
    triggerSuccessModal(expense ? 'Expense Updated Successfully!' : 'Expense Recorded Successfully!');
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <h3 className="mb-4 text-base font-semibold">{expense ? 'Edit Expense' : 'Add Expense'}</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount ₹</label>
            <input
              type="number"
              step="1"
              className="input"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              onFocus={(e) => e.target.select()}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
