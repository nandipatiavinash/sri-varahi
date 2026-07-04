'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Power } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatCurrency } from '@/lib/utils/format';
import { createProduct, updateProduct, setProductStatus } from '@/actions/products';
import { PRODUCT_CATEGORIES, type ProductFormValues } from '@/lib/validations/product';

interface ProductRow {
  id: string;
  name: string;
  category: string;
  default_purchase_price: number;
  default_selling_price: number;
  status: 'active' | 'inactive';
}

export function ProductsClient({ initialProducts }: { initialProducts: ProductRow[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<ProductRow | 'new' | null>(null);

  async function refresh() {
    // simplest reliable approach for a single-owner low-volume app: reload
    window.location.reload();
  }

  async function handleToggleStatus(p: ProductRow) {
    const next = p.status === 'active' ? 'inactive' : 'active';
    const result = await setProductStatus(p.id, next);
    if (!result.ok) return toast.error(result.error);
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    toast.success(`Product marked ${next}`);
  }

  const columns: ColumnDef<ProductRow>[] = [
    { accessorKey: 'name', header: 'Product' },
    { accessorKey: 'category', header: 'Category' },
    {
      accessorKey: 'default_purchase_price',
      header: 'Purchase Price',
      cell: ({ row }) => formatCurrency(row.original.default_purchase_price),
    },
    {
      accessorKey: 'default_selling_price',
      header: 'Selling Price',
      cell: ({ row }) => formatCurrency(row.original.default_selling_price),
    },
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
        title="Products"
        description="Catalog of items you sell. Editing prices here only affects future sales — past bills keep their own saved snapshot."
        action={
          <button onClick={() => setEditing('new')} className="btn-primary">
            <Plus size={16} /> Add Product
          </button>
        }
      />
      <DataTable columns={columns} data={products} searchPlaceholder="Search products…" emptyMessage="No products yet." />

      {editing && (
        <ProductModal
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

function ProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: ProductRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProductFormValues>({
    name: product?.name ?? '',
    category: (product?.category as any) ?? 'Miscellaneous',
    defaultPurchasePrice: product?.default_purchase_price ?? 0,
    defaultSellingPrice: product?.default_selling_price ?? 0,
    status: product?.status ?? 'active',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = product ? await updateProduct(product.id, form) : await createProduct(form);
    setSaving(false);
    if (!result.ok) return toast.error(result.error);
    toast.success(product ? 'Product updated' : 'Product created');
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <h3 className="mb-4 text-base font-semibold">{product ? 'Edit Product' : 'Add Product'}</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as any })}
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Purchase Price ₹</label>
              <input
                type="number"
                step="1"
                className="input"
                value={form.defaultPurchasePrice}
                onChange={(e) => setForm({ ...form, defaultPurchasePrice: Number(e.target.value) })}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div>
              <label className="label">Selling Price ₹</label>
              <input
                type="number"
                step="1"
                className="input"
                value={form.defaultSellingPrice}
                onChange={(e) => setForm({ ...form, defaultSellingPrice: Number(e.target.value) })}
                onFocus={(e) => e.target.select()}
              />
            </div>
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
