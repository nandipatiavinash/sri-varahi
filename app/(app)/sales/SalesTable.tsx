'use client';

import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { checkBillEditWindow } from '@/lib/edit-window';
import { Lock } from 'lucide-react';

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
    <DataTable
      columns={columns}
      data={bills}
      searchPlaceholder="Search bill # or customer…"
      emptyMessage="No bills yet. Create your first sale."
    />
  );
}
