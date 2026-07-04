'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { updateSettings, exportBackup, restoreBackup } from '@/actions/settings';
import type { SettingsFormValues } from '@/lib/validations/settings';

export function SettingsClient({ initialSettings }: { initialSettings: SettingsFormValues }) {
  const [form, setForm] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateSettings(form);
    setSaving(false);
    if (!result.ok) return toast.error(result.error);
    toast.success('Settings saved');
  }

  async function handleExport() {
    const result = await exportBackup();
    if (!result.ok) return toast.error(result.error);
    const blob = new Blob([result.data.json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sri-varahi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup downloaded');
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRestoreConfirm(reader.result as string);
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleConfirmRestore() {
    if (!restoreConfirm) return;
    setRestoring(true);
    const result = await restoreBackup(restoreConfirm);
    setRestoring(false);
    setRestoreConfirm(null);
    if (!result.ok) return toast.error(result.error);
    toast.success('Backup restored');
    window.location.href = '/dashboard';
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card p-5">
        <h3 className="mb-4 text-sm font-semibold text-ink-700">Business Profile</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Business Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-1 text-sm font-semibold text-ink-700">Bill Edit / Delete Window</h3>
        <p className="mb-4 text-sm text-ink-500">
          By default, a bill can only be edited or deleted on the same calendar day it was created — after
          that, it locks and can only be voided. Raise this if your billing sometimes runs past midnight.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Extra grace hours past midnight</label>
            <input
              type="number"
              step="1"
              min={0}
              max={24}
              className="input"
              value={form.editWindowHours}
              onChange={(e) => setForm({ ...form, editWindowHours: Number(e.target.value) })}
              onFocus={(e) => e.target.select()}
            />
          </div>
          <div>
            <label className="label">Timezone</label>
            <input className="input" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      <div className="card p-5">
        <h3 className="mb-1 text-sm font-semibold text-ink-700">Backup & Restore</h3>
        <p className="mb-4 text-sm text-ink-500">
          Export all your data as a JSON file you can keep safe. Restoring replaces all current data —
          use with care.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} className="btn-secondary">
            <Download size={15} /> Download Backup
          </button>
          <label className="btn-secondary cursor-pointer">
            <Upload size={15} /> Restore from Backup
            <input type="file" accept="application/json" className="hidden" onChange={handleFileSelected} />
          </label>
        </div>
      </div>

      {restoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-red-600">
              <AlertTriangle size={18} />
              <h3 className="text-base font-semibold">Confirm Restore</h3>
            </div>
            <p className="mb-4 text-sm text-ink-600">
              This will permanently replace all current bills, products, employees, expenses, and advance
              orders with the contents of this backup file. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRestoreConfirm(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleConfirmRestore} disabled={restoring} className="btn-danger">
                {restoring ? 'Restoring…' : 'Yes, replace all data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
