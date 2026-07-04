'use client';

import { Trash2, Plus } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { BillFormValues } from '@/lib/validations/bill';
import { lineTotal, lineProfit } from '@/lib/billing/calculate';
import { formatCurrency } from '@/lib/utils/format';

export interface ProductOption {
  id: string;
  name: string;
  default_purchase_price: number;
  default_selling_price: number;
}

export function LineItemEditor({
  form,
  products,
}: {
  form: UseFormReturn<BillFormValues>;
  products: ProductOption[];
}) {
  const { watch, setValue, register } = form;
  const items = watch('items');

  function updateItem(index: number, patch: Partial<BillFormValues['items'][number]>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    setValue('items', next, { shouldValidate: true, shouldDirty: true });
  }

  function addRow() {
    setValue('items', [
      ...items,
      { productId: null, productName: '', quantity: 1, purchasePrice: 0, sellingPrice: 0 },
    ]);
  }

  function removeRow(index: number) {
    if (items.length === 1) return;
    setValue(
      'items',
      items.filter((_, i) => i !== index)
    );
  }

  function onProductSelect(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      updateItem(index, { productId: null });
      return;
    }
    updateItem(index, {
      productId: product.id,
      productName: product.name,
      purchasePrice: product.default_purchase_price,
      sellingPrice: product.default_selling_price,
    });
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 p-4">
        <h3 className="text-sm font-semibold text-ink-700">Line Items</h3>
        <button type="button" onClick={addRow} className="btn-secondary px-3 py-1.5 text-xs">
          <Plus size={14} /> Add item
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-medium uppercase tracking-wide text-ink-500">
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2 w-24">Qty</th>
              <th className="px-3 py-2 w-32">Purchase ₹</th>
              <th className="px-3 py-2 w-32">Selling ₹</th>
              <th className="px-3 py-2 w-28 text-right">Total</th>
              <th className="px-3 py-2 w-28 text-right">Profit</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {items.map((item, index) => (
              <tr key={index}>
                <td className="px-3 py-2">
                  <select
                    className="input mb-1"
                    value={item.productId ?? ''}
                    onChange={(e) => onProductSelect(index, e.target.value)}
                  >
                    <option value="">Custom / manual entry</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    className="input"
                    placeholder="Product name"
                    value={item.productName}
                    onChange={(e) => updateItem(index, { productName: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="input"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    value={item.purchasePrice}
                    onChange={(e) => updateItem(index, { purchasePrice: Number(e.target.value) })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    value={item.sellingPrice}
                    onChange={(e) => updateItem(index, { sellingPrice: Number(e.target.value) })}
                  />
                </td>
                <td className="px-3 py-2 text-right font-medium">
                  {formatCurrency(lineTotal({ quantity: item.quantity, purchasePrice: item.purchasePrice, sellingPrice: item.sellingPrice }))}
                </td>
                <td className="px-3 py-2 text-right text-green-700">
                  {formatCurrency(lineProfit({ quantity: item.quantity, purchasePrice: item.purchasePrice, sellingPrice: item.sellingPrice }))}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="text-ink-400 hover:text-red-600"
                    disabled={items.length === 1}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
