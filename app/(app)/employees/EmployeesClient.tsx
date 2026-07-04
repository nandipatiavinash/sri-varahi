'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Pencil, Power, X } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import {
  createEmployee,
  updateEmployee,
  setEmployeeStatus,
  getEmployeeBillsForCurrentMonth,
} from '@/actions/employees';
import type { EmployeeFormValues } from '@/lib/validations/employee';
import { triggerSuccessModal } from '@/components/ui/SuccessModal';

interface EmployeeRow {
  id: string;
  name: string;
  mobile: string | null;
  status: 'active' | 'inactive';
}

export function EmployeesClient({ initialEmployees }: { initialEmployees: EmployeeRow[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [editing, setEditing] = useState<EmployeeRow | 'new' | null>(null);
  const [viewingBillsEmployee, setViewingBillsEmployee] = useState<EmployeeRow | null>(null);

  function refresh() {
    window.location.reload();
  }

  async function handleToggleStatus(e: EmployeeRow) {
    const next = e.status === 'active' ? 'inactive' : 'active';
    const result = await setEmployeeStatus(e.id, next);
    if (!result.ok) return toast.error(result.error);
    setEmployees((prev) => prev.map((x) => (x.id === e.id ? { ...x, status: next } : x)));
    toast.success(`Employee marked ${next}`);
  }

  const columns: ColumnDef<EmployeeRow>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setViewingBillsEmployee(row.original)}
          className="font-medium text-brand-500 hover:text-brand-600 hover:underline text-left"
        >
          {row.original.name}
        </button>
      ),
    },
    { accessorKey: 'mobile', header: 'Mobile', cell: ({ row }) => row.original.mobile || '—' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={row.original.status === 'active' ? 'badge-paid' : 'badge-voided'}>
          {row.original.status}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button onClick={() => setEditing(row.original)} className="text-ink-400 hover:text-brand-600">
            <Pencil size={15} />
          </button>
          <button onClick={() => handleToggleStatus(row.original)} className="text-ink-400 hover:text-red-600">
            <Power size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Staff who handle sales — used for the Employee Performance leaderboard."
        action={
          <button onClick={() => setEditing('new')} className="btn-primary">
            <Plus size={16} /> Add Employee
          </button>
        }
      />
      <DataTable columns={columns} data={employees} searchPlaceholder="Search employees…" emptyMessage="No employees yet." />

      {editing && (
        <EmployeeModal employee={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={refresh} />
      )}

      {viewingBillsEmployee && (
        <EmployeeBillsModal
          employeeId={viewingBillsEmployee.id}
          employeeName={viewingBillsEmployee.name}
          onClose={() => setViewingBillsEmployee(null)}
        />
      )}
    </div>
  );
}

function EmployeeModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: EmployeeRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EmployeeFormValues>({
    name: employee?.name ?? '',
    mobile: employee?.mobile ?? '',
    status: employee?.status ?? 'active',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = employee ? await updateEmployee(employee.id, form) : await createEmployee(form);
    setSaving(false);
    if (!result.ok) return toast.error(result.error);
    triggerSuccessModal(employee ? 'Employee Updated Successfully!' : 'Employee Added Successfully!');
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <h3 className="mb-4 text-base font-semibold">{employee ? 'Edit Employee' : 'Add Employee'}</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Mobile</label>
            <input className="input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
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

function EmployeeBillsModal({
  employeeId,
  employeeName,
  onClose,
}: {
  employeeId: string;
  employeeName: string;
  onClose: () => void;
}) {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBills() {
      setLoading(true);
      const res = await getEmployeeBillsForCurrentMonth(employeeId);
      setLoading(false);
      if (res.ok) {
        setBills(res.data ?? []);
      } else {
        toast.error(res.error);
      }
    }
    fetchBills();
  }, [employeeId]);

  const totalSales = bills.reduce((sum, b) => sum + (b.status !== 'voided' ? Number(b.grand_total) : 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-lg flex flex-col max-h-[85vh]">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-base font-semibold">{employeeName} — Sales This Month</h3>
            <p className="text-xs text-ink-500">Current calendar month bills</p>
          </div>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <p className="py-8 text-center text-sm text-ink-500">Loading bills...</p>
          ) : bills.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-500">No bills recorded for this employee this month.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-3 py-2">Bill No</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {bills.map((b) => (
                  <tr key={b.id}>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/sales/${b.id}`}
                        onClick={onClose}
                        className="font-medium text-brand-500 hover:text-brand-600 hover:underline"
                      >
                        {b.bill_number}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-ink-600">{formatDate(b.bill_date)}</td>
                    <td className="px-3 py-2.5 text-ink-900">{b.customer_name}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(b.grand_total)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && bills.length > 0 && (
          <div className="mt-4 flex justify-between border-t pt-3 text-sm font-semibold text-ink-800">
            <span>Total Bills: {bills.length}</span>
            <span>Total Sales: {formatCurrency(totalSales)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
