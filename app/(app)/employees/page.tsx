import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { EmployeesClient } from './EmployeesClient';

export default async function EmployeesPage() {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: employees } = await supabase
    .from('employees')
    .select('id, name, mobile, status')
    .eq('business_id', business.id)
    .order('name');

  return <EmployeesClient initialEmployees={employees ?? []} />;
}
