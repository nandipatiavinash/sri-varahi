'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { checkBillEditWindow } from '@/lib/edit-window';
import { Lock, RefreshCw } from 'lucide-react';

export interface BillRow {
  id: string;
  bill_number: string;
  bill_date: string;
  customer_name: string;
  grand_total: number;
  balance_due: number;
  status: string;
  created_at: string;
}

export function SalesTable({
  bills,
  timezone,
  editWindowHours,
}: {
  bills: BillRow[];
  timezone: string;
  editWindowHours: number;
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredBills = bills.filter((b) => {
    if (startDate && b.bill_date < startDate) return false;
    if (endDate && b.bill_date > endDate) return false;
    return true;
  });

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const columns: ColumnDef<BillRow>[] = [
    {
      accessorKey: 'bill_number',
      header: 'Bill #',
      cell: ({ row }) => (
        <Link href={`/sales/${row.original.id}`} className="font-medium text-brand-700 hover:underline">
          {row.original.bill_number}
        </Link>
      ),
    },
    {
      accessorKey: 'bill_date',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.bill_date),
    },
    { accessorKey: 'customer_name', header: 'Customer' },
    {
      accessorKey: 'grand_total',
      header: 'Total',
      cell: ({ row }) => formatCurrency(row.original.grand_total),
    },
    {
      accessorKey: 'balance_due',
      header: 'Balance Due',
      cell: ({ row }) =>
        row.original.balance_due > 0 ? (
          <span className="text-red-600">{formatCurrency(row.original.balance_due)}</span>
        ) : (
          <span className="text-ink-400">—</span>
        ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'editable',
      header: '',
      cell: ({ row }) => {
        if (row.original.status === 'voided') return null;
        const check = checkBillEditWindow(row.original.created_at, new Date(), timezone, editWindowHours);
        return check.editable ? (
          <span className="text-xs font-medium text-green-700">Editable today</span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-ink-400">
            <Lock size={12} /> Locked
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Date Filter Panel */}
      <div className="no-print flex flex-wrap items-end gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-500" htmlFor="from-date">From Date</label>
          <input
            id="from-date"
            type="date"
            className="input py-1 px-3 max-w-[180px]"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-500" htmlFor="to-date">To Date</label>
          <input
            id="to-date"
            type="date"
            className="input py-1 px-3 max-w-[180px]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={clearFilters}
            className="btn-secondary h-[38px] px-3.5 flex items-center gap-1.5"
            title="Reset Filters"
          >
            <RefreshCw size={14} className="animate-spin-once" />
            Reset
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredBills}
        searchPlaceholder="Search bill # or customer…"
        emptyMessage={
          startDate || endDate
            ? "No bills found in this date range."
            : "No bills yet. Create your first sale."
        }
      />
    </div>
  );
}
