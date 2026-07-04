'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2, Ban, Lock } from 'lucide-react';
import { deleteBill, voidBill } from '@/actions/bills';
import { checkBillEditWindow } from '@/lib/edit-window';

export function BillActions({
  billId,
  createdAt,
  timezone,
  editWindowHours,
  isVoided,
}: {
  billId: string;
  createdAt: string;
  timezone: string;
  editWindowHours: number;
  isVoided: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingVoid, setConfirmingVoid] = useState(false);

  const check = checkBillEditWindow(createdAt, new Date(), timezone, editWindowHours);
  const editable = check.editable && !isVoided;

  async function handleDelete() {
    setBusy(true);
    const result = await deleteBill(billId);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      setConfirmingDelete(false);
      return;
    }
    toast.success('Bill deleted');
    router.push('/sales');
    router.refresh();
  }

  async function handleVoid() {
    setBusy(true);
    const result = await voidBill(billId);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      setConfirmingVoid(false);
      return;
    }
    toast.success('Bill voided');
    router.refresh();
    setConfirmingVoid(false);
  }

  if (isVoided) {
    return <span className="badge-voided">Voided — no further changes possible</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {editable ? (
        <>
          <Link href={`/sales/${billId}/edit`} className="btn-secondary">
            <Pencil size={15} /> Edit
          </Link>
          {!confirmingDelete ? (
            <button onClick={() => setConfirmingDelete(true)} className="btn-danger">
              <Trash2 size={15} /> Delete
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              <span>Delete permanently? This cannot be undone.</span>
              <button onClick={handleDelete} disabled={busy} className="btn-danger px-2 py-1">
                Yes, delete
              </button>
              <button onClick={() => setConfirmingDelete(false)} className="btn-ghost px-2 py-1">
                Cancel
              </button>
            </div>
          )}
        </>
      ) : (
        <span className="flex items-center gap-1.5 rounded-lg bg-ink-100 px-3 py-2 text-xs text-ink-500">
          <Lock size={13} /> {check.reason}
        </span>
      )}

      {!confirmingVoid ? (
        <button onClick={() => setConfirmingVoid(true)} className="btn-ghost">
          <Ban size={15} /> Void
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-ink-100 px-3 py-2 text-sm">
          <span>Void this bill? It stays visible but no longer counts in reports.</span>
          <button onClick={handleVoid} disabled={busy} className="btn-secondary px-2 py-1">
            Yes, void
          </button>
          <button onClick={() => setConfirmingVoid(false)} className="btn-ghost px-2 py-1">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
