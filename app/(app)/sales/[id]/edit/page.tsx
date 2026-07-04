import { notFound, redirect } from 'next/navigation';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { checkBillEditWindow } from '@/lib/edit-window';
import { PageHeader } from '@/components/ui/PageHeader';
import { BillForm } from '@/components/billing/BillForm';

export default async function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: bill } = await supabase
    .from('bills')
    .select('*')
    .eq('id', id)
    .eq('business_id', business.id)
    .single();

  if (!bill) notFound();

  // Server-side enforcement — this is the real gate. The UI on the detail
  // page hides the Edit button once this fails, but a direct URL hit must
  // be blocked here too, not just client-side.
  const check = checkBillEditWindow(bill.created_at, new Date(), business.timezone, business.edit_window_hours);
  if (!check.editable || bill.voided_at) {
    redirect(`/sales/${id}`);
  }

  const [{ data: items }, { data: splits }, { data: products }, { data: employees }] = await Promise.all([
    supabase.from('bill_items').select('*').eq('bill_id', id),
    supabase.from('payment_splits').select('*').eq('bill_id', id),
    supabase
      .from('products')
      .select('id, name, default_purchase_price, default_selling_price')
      .eq('business_id', business.id)
      .eq('status', 'active')
      .order('name'),
    supabase.from('employees').select('id, name').eq('business_id', business.id).eq('status', 'active').order('name'),
  ]);

  return (
    <div>
      <PageHeader
        title={`Edit Bill ${bill.bill_number}`}
        description="Editable until end of day only — this bill was created today."
      />
      <BillForm
        mode="edit"
        billId={bill.id}
        products={products ?? []}
        employees={employees ?? []}
        defaultValues={{
          billNumber: bill.bill_number,
          billDate: bill.bill_date,
          customerName: bill.customer_name,
          customerMobile: bill.customer_mobile ?? '',
          employeeId: bill.employee_id,
          discount: Number(bill.discount),
          grandTotal: Number(bill.grand_total),
          notes: bill.notes ?? '',
          items: (items ?? []).map((i) => ({
            productId: i.product_id,
            productName: i.product_name_snapshot,
            quantity: Number(i.quantity),
            purchasePrice: Number(i.purchase_price),
            sellingPrice: Number(i.selling_price),
          })),
          paymentSplits: (splits ?? []).map((s) => ({
            method: s.method,
            amount: Number(s.amount),
          })),
        }}
      />
    </div>
  );
}
