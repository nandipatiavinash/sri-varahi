import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppLayoutClient } from '@/components/AppLayoutClient';
import { SuccessModal } from '@/components/ui/SuccessModal';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: business } = await supabase
    .from('businesses')
    .select('name')
    .eq('owner_id', user.id)
    .single();

  const businessName = business?.name ?? 'Sri Varahi Building Solutions';

  return (
    <AppLayoutClient businessName={businessName}>
      {children}
    </AppLayoutClient>
  );
}
