import Link from 'next/link';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  const supabase = await createClient();
  const business = await getCurrentBusiness();

  let bills: any[] = [];
  let products: any[] = [];
  let advanceOrders: any[] = [];

  if (query) {
    const [billsRes, productsRes, advanceRes] = await Promise.all([
      supabase
        .from('bills')
        .select('id, bill_number, customer_name, grand_total, bill_date, status')
        .eq('business_id', business.id)
        .or(`bill_number.ilike.%${query}%,customer_name.ilike.%${query}%,customer_mobile.ilike.%${query}%`)
        .limit(20),
      supabase
        .from('products')
        .select('id, name, category, default_selling_price')
        .eq('business_id', business.id)
        .ilike('name', `%${query}%`)
        .limit(20),
      supabase
        .from('advance_orders')
        .select('id, customer_name, advance_amount, status')
        .eq('business_id', business.id)
        .ilike('customer_name', `%${query}%`)
        .limit(20),
    ]);
    bills = billsRes.data ?? [];
    products = productsRes.data ?? [];
    advanceOrders = advanceRes.data ?? [];
  }

  return (
    <div>
      <PageHeader title="Search" description="Search across bills, products, and advance orders." />
      <form className="mb-6">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by bill number, customer name, mobile, or product…"
          className="input"
          autoFocus
        />
      </form>

      {query && (
        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink-700">Bills ({bills.length})</h3>
            <div className="card divide-y divide-ink-100">
              {bills.map((b) => (
                <Link key={b.id} href={`/sales/${b.id}`} className="flex justify-between px-4 py-2.5 text-sm hover:bg-ink-50">
                  <span>{b.bill_number} — {b.customer_name}</span>
                  <span>{formatCurrency(b.grand_total)} · {formatDate(b.bill_date)}</span>
                </Link>
              ))}
              {bills.length === 0 && <p className="px-4 py-4 text-sm text-ink-400">No matching bills.</p>}
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink-700">Products ({products.length})</h3>
            <div className="card divide-y divide-ink-100">
              {products.map((p) => (
                <Link key={p.id} href="/products" className="flex justify-between px-4 py-2.5 text-sm hover:bg-ink-50">
                  <span>{p.name} <span className="text-ink-400">· {p.category}</span></span>
                  <span>{formatCurrency(p.default_selling_price)}</span>
                </Link>
              ))}
              {products.length === 0 && <p className="px-4 py-4 text-sm text-ink-400">No matching products.</p>}
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink-700">Advance Orders ({advanceOrders.length})</h3>
            <div className="card divide-y divide-ink-100">
              {advanceOrders.map((o) => (
                <Link key={o.id} href="/advance-orders" className="flex justify-between px-4 py-2.5 text-sm hover:bg-ink-50">
                  <span>{o.customer_name}</span>
                  <span>{formatCurrency(o.advance_amount)} · {o.status}</span>
                </Link>
              ))}
              {advanceOrders.length === 0 && <p className="px-4 py-4 text-sm text-ink-400">No matching advance orders.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
