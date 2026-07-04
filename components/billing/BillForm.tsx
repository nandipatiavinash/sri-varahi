'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { billSchema, type BillFormValues } from '@/lib/validations/bill';
import { computeSubtotal, computeGrossProfit, suggestGrandTotal } from '@/lib/billing/calculate';
import { createBill, updateBill } from '@/actions/bills';
import { convertAdvanceOrderToBill } from '@/actions/advance-orders';
import { LineItemEditor, type ProductOption } from './LineItemEditor';
import { PaymentSplitEditor } from './PaymentSplitEditor';
import { formatCurrency } from '@/lib/utils/format';
import { triggerSuccessModal } from '@/components/ui/SuccessModal';

export interface EmployeeOption {
  id: string;
  name: string;
}

export function BillForm({
  mode,
  billId,
  suggestedBillNumber,
  products,
  employees,
  defaultValues,
  advanceOrderId,
}: {
  mode: 'create' | 'edit';
  billId?: string;
  suggestedBillNumber?: string;
  products: ProductOption[];
  employees: EmployeeOption[];
  defaultValues?: Partial<BillFormValues>;
  advanceOrderId?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      billNumber: suggestedBillNumber ?? '',
      billDate: new Date().toISOString().slice(0, 10),
      customerName: '',
      customerMobile: '',
      employeeId: null,
      discount: 0,
      grandTotal: 0,
      notes: '',
      items: [{ productId: null, productName: '', quantity: 1, purchasePrice: 0, sellingPrice: 0 }],
      paymentSplits: [{ method: 'cash', amount: 0 }],
      ...defaultValues,
    },
  });

  const { watch, setValue, handleSubmit, register } = form;
  const items = watch('items');
  const discount = watch('discount');
  const grandTotal = watch('grandTotal');

  const subtotal = computeSubtotal(items);
  const grossProfit = computeGrossProfit(items, discount || 0);

  // Auto-calculate grand total when subtotal or discount changes
  useEffect(() => {
    setValue('grandTotal', suggestGrandTotal(subtotal, discount || 0));
  }, [subtotal, discount, setValue]);

  function applySuggestedTotal() {
    setValue('grandTotal', suggestGrandTotal(subtotal, discount || 0));
  }

  async function onSubmit(values: BillFormValues) {
    setSubmitting(true);
    const result =
      mode === 'create' ? await createBill(values) : await updateBill(billId!, values);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    if (mode === 'create' && advanceOrderId) {
      const conversion = await convertAdvanceOrderToBill(advanceOrderId, result.data!.id);
      if (!conversion.ok) {
        toast.error(`Bill created, but linking to the advance order failed: ${conversion.error}`);
      }
    }

    triggerSuccessModal(mode === 'create' ? 'Bill Created Successfully!' : 'Bill Updated Successfully!');
    router.push(`/sales/${result.data!.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Bill Number</label>
          <input className="input" {...register('billNumber')} />
          {form.formState.errors.billNumber && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.billNumber.message}</p>
          )}
        </div>
        <div>
          <label className="label">Bill Date</label>
          <input type="date" className="input" {...register('billDate')} />
        </div>
        <div>
          <label className="label">Customer Name</label>
          <input className="input" {...register('customerName')} />
          {form.formState.errors.customerName && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.customerName.message}</p>
          )}
        </div>
        <div>
          <label className="label">Customer Mobile</label>
          <input className="input" {...register('customerMobile')} />
        </div>
        <div>
          <label className="label">Employee (who handled this sale)</label>
          <select
            className="input"
            value={watch('employeeId') ?? ''}
            onChange={(e) => setValue('employeeId', e.target.value || null)}
          >
            <option value="">— None —</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Discount ₹</label>
          <input
            type="number"
            step="1"
            min="0"
            className="input"
            value={discount}
            onChange={(e) => setValue('discount', Number(e.target.value))}
            onFocus={(e) => e.target.select()}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="label">Notes</label>
          <input className="input" {...register('notes')} />
        </div>
      </div>

      <LineItemEditor form={form} products={products} />

      <div className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-ink-500">Subtotal</p>
          <p className="text-lg font-semibold">{formatCurrency(subtotal)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-ink-500">Gross Profit</p>
          <p className="text-lg font-semibold text-green-700">{formatCurrency(grossProfit)}</p>
        </div>
        <div>
          <label className="label flex items-center justify-between">
            Grand Total (editable) ₹
            <button type="button" onClick={applySuggestedTotal} className="text-xs font-normal text-brand-600 hover:underline">
              Use suggested
            </button>
          </label>
          <input
            type="number"
            step="1"
            min="0"
            className="input font-semibold"
            value={grandTotal}
            onChange={(e) => setValue('grandTotal', Number(e.target.value))}
            onFocus={(e) => e.target.select()}
          />
        </div>
      </div>

      <PaymentSplitEditor form={form} grandTotal={grandTotal || 0} />

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Saving…' : mode === 'create' ? 'Create Bill' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
