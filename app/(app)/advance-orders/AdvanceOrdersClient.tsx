'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Pencil, Ban, ArrowRightCircle } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatCurrency, formatDate, todayISO } from '@/lib/utils/format';
import { createAdvanceOrder, updateAdvanceOrder, cancelAdvanceOrder } from '@/actions/advance-orders';
import type { AdvanceOrderFormValues } from '@/lib/validations/advance-order';
import { triggerSuccessModal } from '@/components/ui/SuccessModal';

interface AdvanceOrderRow {
  id: string;
  customer_name: string;
  customer_mobile: string | null;
  advance_amount: number;
  expected_delivery_date: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string | null;
  converted_bill_id: string | null;
}

export function AdvanceOrdersClient({ initialOrders }: { initialOrders: AdvanceOrderRow[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [editing, setEditing] = useState<AdvanceOrderRow | 'new' | null>(null);

  function refresh() {
    window.location.reload();
  }

  async function handleCancel(id: string) {
    const result = await cancelAdvanceOrder(id);
    if (!result.ok) return toast.error(result.error);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o)));
    triggerSuccessModal('Advance Order Cancelled Successfully!');
  }

  const columns: ColumnDef<AdvanceOrderRow>[] = [
    { accessorKey: 'customer_name', header: 'Customer' },
    { accessorKey: 'customer_mobile', header: 'Mobile', cell: ({ row }) => row.original.customer_mobile || '—' },
    { accessorKey: 'advance_amount', header: 'Advance Paid', cell: ({ row }) => formatCurrency(row.original.advance_amount) },
    {
      accessorKey: 'expected_delivery_date',
      header: 'Expected Delivery',
      cell: ({ row }) => (row.original.expected_delivery_date ? formatDate(row.original.expected_delivery_date) : '—'),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        const cls = s === 'pending' ? 'badge-partial' : s === 'completed' ? 'badge-paid' : 'badge-voided';
        return <span className={cls}>{s}</span>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const o = row.original;
        if (o.status !== 'pending') {
          return o.converted_bill_id ? (
            <Link href={`/sales/${o.converted_bill_id}`} className="text-xs font-medium text-brand-600 hover:underline">
              View bill
            </Link>
          ) : null;
        }
        return (
          <div className="flex gap-2">
            <Link
              href={`/sales/new?advanceOrderId=${o.id}&customerName=${encodeURIComponent(o.customer_name)}&advanceAmount=${o.advance_amount}`}
              className="text-ink-400 hover:text-green-600"
              title="Convert to sale"
            >
              <ArrowRightCircle size={16} />
            </Link>
            <button onClick={() => setEditing(o)} className="text-ink-400 hover:text-brand-600">
              <Pencil size={15} />
            </button>
            <button onClick={() => handleCancel(o.id)} className="text-ink-400 hover:text-red-600">
              <Ban size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Advance Orders"
        description="Pre-sale customer deposits. Convert to a bill once the order is delivered."
        action={
          <button onClick={() => setEditing('new')} className="btn-primary">
            <Plus size={16} /> New Advance Order
          </button>
        }
      />
      <DataTable columns={columns} data={orders} searchPlaceholder="Search customer…" emptyMessage="No advance orders yet." />

      {editing && (
        <AdvanceOrderModal order={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={refresh} />
      )}
    </div>
  );
}

function AdvanceOrderModal({
  order,
  onClose,
  onSaved,
}: {
  order: AdvanceOrderRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AdvanceOrderFormValues>({
    customerName: order?.customer_name ?? '',
    customerMobile: order?.customer_mobile ?? '',
    advanceAmount: order?.advance_amount ?? 0,
    expectedDeliveryDate: order?.expected_delivery_date ?? todayISO(),
    notes: order?.notes ?? '',
    status: order?.status ?? 'pending',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = order ? await updateAdvanceOrder(order.id, form) : await createAdvanceOrder(form);
    setSaving(false);
    if (!result.ok) return toast.error(result.error);
    triggerSuccessModal(order ? 'Order Updated Successfully!' : 'Advance Order Created Successfully!');
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <h3 className="mb-4 text-base font-semibold">{order ? 'Edit Advance Order' : 'New Advance Order'}</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Customer Name</label>
            <input className="input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          </div>
          <div>
            <label className="label">Mobile</label>
            <input className="input" value={form.customerMobile} onChange={(e) => setForm({ ...form, customerMobile: e.target.value })} />
          </div>
          <div>
            <label className="label">Advance Amount ₹</label>
            <input
              type="number"
              step="1"
              className="input"
              value={form.advanceAmount}
              onChange={(e) => setForm({ ...form, advanceAmount: Number(e.target.value) })}
              onFocus={(e) => e.target.select()}
            />
          </div>
          <div>
            <label className="label">Expected Delivery Date</label>
            <input
              type="date"
              className="input"
              value={form.expectedDeliveryDate}
              onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
