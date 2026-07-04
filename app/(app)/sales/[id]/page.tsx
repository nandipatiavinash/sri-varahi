import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Printer, IndianRupee } from 'lucide-react';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { BillActions } from './BillActions';

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: bill } = await supabase
    .from('bills')
    .select('*, employees(name)')
    .eq('id', id)
    .eq('business_id', business.id)
    .single();

  if (!bill) notFound();

  const [{ data: items }, { data: splits }, { data: creditPayments }] = await Promise.all([
    supabase.from('bill_items').select('*').eq('bill_id', id),
    supabase.from('payment_splits').select('*').eq('bill_id', id),
    supabase.from('credit_payments').select('*').eq('bill_id', id).order('paid_at', { ascending: false }),
  ]);

  return (
    <div>
      <PageHeader
        title={`Bill ${bill.bill_number}`}
        description={`${bill.customer_name} · ${formatDate(bill.bill_date)}`}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/reports/print/bill/${bill.id}`} target="_blank" className="btn-secondary">
              <Printer size={15} /> Print
            </Link>
            <BillActions
              billId={bill.id}
              createdAt={bill.created_at}
              timezone={business.timezone}
              editWindowHours={business.edit_window_hours}
              isVoided={!!bill.voided_at}
            />
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-ink-500">Status</p>
          <div className="mt-1"><StatusBadge status={bill.status} /></div>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-500">Grand Total</p>
          <p className="text-lg font-semibold">{formatCurrency(bill.grand_total)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-500">Gross Profit</p>
          <p className={`text-lg font-semibold ${bill.gross_profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {formatCurrency(bill.gross_profit)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-500">Balance Due</p>
          <p className={`text-lg font-semibold ${bill.balance_due > 0 ? 'text-red-600' : ''}`}>
            {formatCurrency(bill.balance_due)}
          </p>
        </div>
      </div>

      <div className="card mb-5 overflow-hidden">
        <div className="border-b border-ink-100 p-4">
          <h3 className="text-sm font-semibold text-ink-700">Line Items</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Qty</th>
              <th className="px-4 py-2">Purchase</th>
              <th className="px-4 py-2">Selling</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2 text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(items ?? []).map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-2.5">{i.product_name_snapshot}</td>
                <td className="px-4 py-2.5">{i.quantity}</td>
                <td className="px-4 py-2.5">{formatCurrency(i.purchase_price)}</td>
                <td className="px-4 py-2.5">{formatCurrency(i.selling_price)}</td>
                <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(i.line_total)}</td>
                <td className={`px-4 py-2.5 text-right ${i.line_profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {formatCurrency(i.line_profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink-700">Payment Splits</h3>
          <ul className="space-y-2 text-sm">
            {(splits ?? []).map((s) => (
              <li key={s.id} className="flex justify-between">
                <span className="capitalize text-ink-600">{s.method}</span>
                <span className="font-medium">{formatCurrency(s.amount)}</span>
              </li>
            ))}
            {(splits ?? []).length === 0 && <li className="text-ink-400">No payments recorded.</li>}
          </ul>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-700">Credit Payment History</h3>
            {bill.balance_due > 0 && (
              <Link href={`/credit-customers?bill=${bill.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                <IndianRupee size={12} className="mr-0.5 inline" /> Record payment
              </Link>
            )}
          </div>
          <ul className="space-y-2 text-sm">
            {(creditPayments ?? []).map((p) => (
              <li key={p.id} className="flex justify-between">
                <span className="text-ink-600">{formatDate(p.paid_at)} · {p.method}</span>
                <span className="font-medium">{formatCurrency(p.amount)}</span>
              </li>
            ))}
            {(creditPayments ?? []).length === 0 && <li className="text-ink-400">No credit payments yet.</li>}
          </ul>
        </div>
      </div>

      {bill.notes && (
        <div className="card mt-5 p-4">
          <h3 className="mb-1 text-sm font-semibold text-ink-700">Notes</h3>
          <p className="text-sm text-ink-600">{bill.notes}</p>
        </div>
      )}
    </div>
  );
}
