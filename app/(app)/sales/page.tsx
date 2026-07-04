import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { SalesTable } from './SalesTable';

export default async function SalesPage() {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: bills } = await supabase
    .from('bills')
    .select('id, bill_number, bill_date, customer_name, grand_total, balance_due, status, created_at')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title="Sales / Billing"
        description="All bills. Only bills created today can be edited or deleted — older bills can be voided instead."
        action={
          <Link href="/sales/new" className="btn-primary">
            <Plus size={16} /> New Sale
          </Link>
        }
      />
      <SalesTable
        bills={bills ?? []}
        timezone={business.timezone}
        editWindowHours={business.edit_window_hours}
      />
    </div>
  );
}
