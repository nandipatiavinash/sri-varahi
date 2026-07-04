import { notFound } from 'next/navigation';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { PrintButton } from '@/components/reports/PrintButton';

export default async function PrintBillPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: items } = await supabase.from('bill_items').select('*').eq('bill_id', id);
  const { data: splits } = await supabase.from('payment_splits').select('*').eq('bill_id', id);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between border-b border-ink-200 pb-4 no-print:border-b">
        <div>
          <h1 className="text-lg font-bold">{business.name}</h1>
          {business.address && <p className="text-sm text-ink-600">{business.address}</p>}
          {business.phone && <p className="text-sm text-ink-600">Ph: {business.phone}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-base font-semibold">INVOICE</h2>
          <p className="text-sm">Bill #: {bill.bill_number}</p>
          <p className="text-sm">Date: {formatDate(bill.bill_date)}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-ink-700">Bill To</p>
        <p className="text-sm">{bill.customer_name}</p>
        {bill.customer_mobile && <p className="text-sm text-ink-600">{bill.customer_mobile}</p>}
      </div>

      <table className="mb-4 w-full text-sm">
        <thead>
          <tr className="border-b border-ink-300 text-left">
            <th className="py-1.5">Item</th>
            <th className="py-1.5">Qty</th>
            <th className="py-1.5 text-right">Rate</th>
            <th className="py-1.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(items ?? []).map((i) => (
            <tr key={i.id} className="border-b border-ink-100">
              <td className="py-1.5">{i.product_name_snapshot}</td>
              <td className="py-1.5">{i.quantity}</td>
              <td className="py-1.5 text-right">{formatCurrency(i.selling_price)}</td>
              <td className="py-1.5 text-right">{formatCurrency(i.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto w-56 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(bill.subtotal)}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(bill.discount)}</span></div>
        <div className="flex justify-between border-t border-ink-300 pt-1 font-semibold">
          <span>Grand Total</span><span>{formatCurrency(bill.grand_total)}</span>
        </div>
        <div className="flex justify-between"><span>Paid</span><span>{formatCurrency(bill.paid_amount)}</span></div>
        {bill.balance_due > 0 && (
          <div className="flex justify-between font-medium text-red-600">
            <span>Balance Due</span><span>{formatCurrency(bill.balance_due)}</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs text-ink-500">
          Payment: {(splits ?? []).map((s) => `${s.method} ${formatCurrency(s.amount)}`).join(', ') || '—'}
        </p>
      </div>

      {bill.notes && <p className="mt-4 text-xs text-ink-600">Notes: {bill.notes}</p>}

      <div className="no-print mt-8">
        <PrintButton />
      </div>
    </div>
  );
}
