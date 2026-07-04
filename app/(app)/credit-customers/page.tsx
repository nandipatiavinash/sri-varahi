import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { CreditCustomersClient } from './CreditCustomersClient';

export default async function CreditCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ bill?: string }>;
}) {
  const { bill } = await searchParams;
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: bills } = await supabase
    .from('bills')
    .select('id, bill_number, bill_date, customer_name, customer_mobile, grand_total, paid_amount, balance_due, status')
    .eq('business_id', business.id)
    .in('status', ['credit', 'partial'])
    .order('bill_date', { ascending: true });

  return <CreditCustomersClient initialBills={bills ?? []} preselectedBillId={bill} />;
}
