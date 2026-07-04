'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Power } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { createEmployee, updateEmployee, setEmployeeStatus } from '@/actions/employees';
import type { EmployeeFormValues } from '@/lib/validations/employee';

interface EmployeeRow {
  id: string;
  name: string;
  mobile: string | null;
  status: 'active' | 'inactive';
}

export function EmployeesClient({ initialEmployees }: { initialEmployees: EmployeeRow[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [editing, setEditing] = useState<EmployeeRow | 'new' | null>(null);

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
    { accessorKey: 'name', header: 'Name' },
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
    toast.success(employee ? 'Employee updated' : 'Employee added');
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
