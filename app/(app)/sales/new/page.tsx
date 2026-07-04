import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { getNextSuggestedBillNumber } from '@/actions/bills';
import { PageHeader } from '@/components/ui/PageHeader';
import { BillForm } from '@/components/billing/BillForm';

export default async function NewSalePage({
  searchParams,
}: {
  searchParams: Promise<{ advanceOrderId?: string; customerName?: string; advanceAmount?: string }>;
}) {
  const { advanceOrderId, customerName, advanceAmount } = await searchParams;
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const [products, employees, suggestedBillNumber] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, default_purchase_price, default_selling_price')
      .eq('business_id', business.id)
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('employees')
      .select('id, name')
      .eq('business_id', business.id)
      .eq('status', 'active')
      .order('name'),
    getNextSuggestedBillNumber(),
  ]);

  return (
    <div>
      <PageHeader
        title={advanceOrderId ? 'Convert Advance Order to Sale' : 'New Sale'}
        description="Create a bill. You can edit or delete it later today only."
      />
      <BillForm
        mode="create"
        suggestedBillNumber={suggestedBillNumber}
        products={products.data ?? []}
        employees={employees.data ?? []}
        advanceOrderId={advanceOrderId}
        defaultValues={
          customerName
            ? {
                customerName,
                paymentSplits: advanceAmount
                  ? [{ method: 'advance', amount: Number(advanceAmount) }]
                  : undefined,
              }
            : undefined
        }
      />
    </div>
  );
}
