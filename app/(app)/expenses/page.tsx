import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { ExpensesClient } from './ExpensesClient';

export default async function ExpensesPage() {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, date, category, amount, description')
    .eq('business_id', business.id)
    .order('date', { ascending: false });

  return <ExpensesClient initialExpenses={expenses ?? []} />;
}
