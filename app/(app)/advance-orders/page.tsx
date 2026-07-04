import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { AdvanceOrdersClient } from './AdvanceOrdersClient';

export default async function AdvanceOrdersPage() {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: orders } = await supabase
    .from('advance_orders')
    .select('id, customer_name, customer_mobile, advance_amount, expected_delivery_date, status, notes, converted_bill_id')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false });

  return <AdvanceOrdersClient initialOrders={orders ?? []} />;
}
