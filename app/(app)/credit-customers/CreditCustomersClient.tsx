'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { IndianRupee, AlertTriangle } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { recordCreditPayment } from '@/actions/credit-payments';
import { triggerSuccessModal } from '@/components/ui/SuccessModal';

interface CreditBillRow {
  id: string;
  bill_number: string;
  bill_date: string;
  customer_name: string;
  customer_mobile: string | null;
  grand_total: number;
  paid_amount: number;
  balance_due: number;
  status: string;
}

// Overdue is auto-computed here (not a stored field) — a bill is overdue if
// it's still unpaid after 15 days, a reasonable default for a building
// materials store. Adjust the threshold below if the owner wants different.
const OVERDUE_DAYS = 15;

export function CreditCustomersClient({
  initialBills,
  preselectedBillId,
}: {
  initialBills: CreditBillRow[];
  preselectedBillId?: string;
}) {
  const [bills, setBills] = useState(initialBills);
  const [payingBill, setPayingBill] = useState<CreditBillRow | null>(
    preselectedBillId ? bills.find((b) => b.id === preselectedBillId) ?? null : null
  );

  function isOverdue(billDate: string) {
    const days = (Date.now() - new Date(billDate).getTime()) / (1000 * 60 * 60 * 24);
    return days > OVERDUE_DAYS;
  }

  function refresh() {
    window.location.reload();
  }

  const totalOutstanding = bills.reduce((s, b) => s + Number(b.balance_due), 0);

  const columns: ColumnDef<CreditBillRow>[] = [
    {
      accessorKey: 'bill_number',
      header: 'Bill #',
      cell: ({ row }) => (
        <Link href={`/sales/${row.original.id}`} className="font-medium text-brand-700 hover:underline">
          {row.original.bill_number}
        </Link>
      ),
    },
    { accessorKey: 'customer_name', header: 'Customer' },
    { accessorKey: 'customer_mobile', header: 'Mobile', cell: ({ row }) => row.original.customer_mobile || '—' },
    { accessorKey: 'bill_date', header: 'Bill Date', cell: ({ row }) => formatDate(row.original.bill_date) },
    { accessorKey: 'grand_total', header: 'Total', cell: ({ row }) => formatCurrency(row.original.grand_total) },
    {
      accessorKey: 'balance_due',
      header: 'Balance Due',
      cell: ({ row }) => <span className="font-medium text-red-600">{formatCurrency(row.original.balance_due)}</span>,
    },
    {
      id: 'overdue',
      header: 'Overdue',
      cell: ({ row }) =>
        isOverdue(row.original.bill_date) ? (
          <span className="flex items-center gap-1 text-xs font-medium text-red-600">
            <AlertTriangle size={12} /> Overdue
          </span>
        ) : (
          <span className="text-xs text-ink-400">Within terms</span>
        ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button onClick={() => setPayingBill(row.original)} className="btn-secondary px-2.5 py-1 text-xs">
          <IndianRupee size={13} /> Record Payment
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Credit Customers"
        description={`Derived from bills with an outstanding balance — total outstanding: ${formatCurrency(totalOutstanding)}`}
      />
      <DataTable columns={columns} data={bills} searchPlaceholder="Search customer…" emptyMessage="No outstanding credit — nice!" />

      {payingBill && (
        <RecordPaymentModal bill={payingBill} onClose={() => setPayingBill(null)} onSaved={refresh} />
      )}
    </div>
  );
}

function RecordPaymentModal({
  bill,
  onClose,
  onSaved,
}: {
  bill: CreditBillRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(bill.balance_due);
  const [method, setMethod] = useState<'cash' | 'upi' | 'bank'>('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await recordCreditPayment({ billId: bill.id, amount, method, notes });
    setSaving(false);
    if (!result.ok) return toast.error(result.error);
    triggerSuccessModal('Payment Recorded Successfully!');
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
        <h3 className="mb-1 text-base font-semibold">Record Payment</h3>
        <p className="mb-4 text-sm text-ink-500">
          {bill.bill_number} · {bill.customer_name} · Balance {formatCurrency(bill.balance_due)}
        </p>
        <div className="space-y-3">
          <div>
            <label className="label">Amount ₹</label>
            <input
              type="number"
              step="1"
              className="input"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              onFocus={(e) => e.target.select()}
            />
          </div>
          <div>
            <label className="label">Method</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value as any)}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Record'}
          </button>
        </div>
      </div>
    </div>
  );
}
