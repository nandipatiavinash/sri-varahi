'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getExportData } from '@/actions/export';

export function ExcelExporter() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today.slice(0, 8) + '01'); // start of current month
  const [to, setTo] = useState(today);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!from || !to) {
      toast.error('Please select both start and end dates');
      return;
    }
    if (from > to) {
      toast.error('Start date cannot be after end date');
      return;
    }

    try {
      setDownloading(true);
      const res = await getExportData(from, to);
      setDownloading(false);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      const data = res.data!;

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Bills
      const wsBills = XLSX.utils.json_to_sheet(
        data.bills.length > 0
          ? data.bills
          : [{ 'Message': 'No bills found in this date range.' }]
      );
      XLSX.utils.book_append_sheet(wb, wsBills, 'Bills (Sales)');

      // Sheet 2: Expenses
      const wsExpenses = XLSX.utils.json_to_sheet(
        data.expenses.length > 0
          ? data.expenses
          : [{ 'Message': 'No expenses found in this date range.' }]
      );
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

      // Sheet 3: Staff Sales
      const wsStaff = XLSX.utils.json_to_sheet(
        data.staffSales.length > 0
          ? data.staffSales
          : [{ 'Message': 'No staff sales found in this date range.' }]
      );
      XLSX.utils.book_append_sheet(wb, wsStaff, 'Staff Sales');

      // Trigger download
      XLSX.writeFile(wb, `sri_varahi_data_${from}_to_${to}.xlsx`);
      toast.success('Excel file downloaded successfully');
    } catch (error: any) {
      setDownloading(false);
      toast.error(error.message || 'An error occurred during export');
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 border-b border-ink-100 pb-4 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
          <FileSpreadsheet size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-ink-900">Export All Data to Excel</h3>
          <p className="text-xs text-ink-500">Downloads a multi-sheet spreadsheet (Bills, Expenses, and Staff Sales) for any date range.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="label">Start Date</label>
          <input
            type="date"
            className="input py-1.5 px-3 text-sm w-44"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="label">End Date</label>
          <input
            type="date"
            className="input py-1.5 px-3 text-sm w-44"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-2 h-[38px] px-4 rounded-lg text-sm font-medium"
        >
          <Download size={16} />
          {downloading ? 'Exporting…' : 'Download Excel'}
        </button>
      </div>
    </div>
  );
}
