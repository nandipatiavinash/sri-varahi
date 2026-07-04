import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <div className="mx-auto max-w-3xl bg-white p-8 print:p-0">{children}</div>;
}
