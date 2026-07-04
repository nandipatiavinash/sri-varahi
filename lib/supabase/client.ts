import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

// Client-side Supabase client for use in Client Components (e.g. auth forms,
// realtime-ish optimistic reads). All writes still go through Server Actions.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
