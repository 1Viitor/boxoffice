import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function supabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

/**
 * Server-side database key. Accepts publishable (`sb_publishable_…`), anon, or
 * service-role keys. Publishable/anon keys require RLS policies (0002_policies).
 */
function supabaseKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Server-side Supabase client. Never import this into client components.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached) return cached;
  const url = supabaseUrl();
  const key = supabaseKey();
  if (!url || !key) return null;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function isDbConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
}
