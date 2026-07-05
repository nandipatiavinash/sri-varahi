import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { Database } from '@/types/database.types';

export function isRedirectError(error: any): boolean {
  return (
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof error.digest === 'string' &&
    error.digest.startsWith('NEXT_REDIRECT;')
  );
}

// Server-side Supabase client for use in Server Components, Server Actions,
// and Route Handlers. RLS (business_id -> owner_id = auth.uid()) is the real
// security boundary here, not this wrapper.
// Wrapped in React cache to deduplicate client creation per request lifecycle.
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component with no write access; middleware
            // refreshes the session instead, so this is safe to ignore.
          }
        },
      },
    }
  );
});

// Returns the current signed-in user's business row (single-owner model).
// Throws if there's no session or no business yet, since every protected
// page/action assumes one exists.
// Wrapped in React cache to deduplicate database queries per request lifecycle.
export const getCurrentBusiness = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (error || !business) {
    redirect('/login');
  }

  return business;
});
