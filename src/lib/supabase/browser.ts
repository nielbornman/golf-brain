import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { url, anonKey };
}

/**
 * Browser-only Supabase client.
 * - No next/headers
 * - No createServerClient
 * - Safe for Client Components and Pages
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  if (cached) return cached;

  const { url, anonKey } = getEnv();
  cached = createBrowserClient(url, anonKey);
  return cached;
}

/** Optional alias for consistency with older imports */
export function createBrowserClientSingleton(): SupabaseClient {
  return createSupabaseBrowserClient();
}