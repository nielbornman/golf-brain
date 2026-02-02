import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";
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
 * Browser client (PKCE-friendly).
 * IMPORTANT: do NOT import next/headers here.
 */
export function createBrowserClient(): SupabaseClient {
  if (cached) return cached;

  const { url, anonKey } = getEnv();
  cached = createSSRBrowserClient(url, anonKey);
  return cached;
}

/** Backwards-compatible alias for older call sites. */
export function createSupabaseBrowserClient(): SupabaseClient {
  return createBrowserClient();
}