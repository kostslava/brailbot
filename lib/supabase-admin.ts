import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseUrl } from "@/lib/supabase-url";

/**
 * Server-only client with elevated access (bypasses RLS).
 * New projects: use `SUPABASE_SECRET_KEY` (`sb_secret_…` from Dashboard → Settings → API Keys).
 * Legacy: `SUPABASE_SERVICE_ROLE_KEY` (JWT `service_role`) still works during the transition.
 *
 * @see https://supabase.com/docs/guides/api/api-keys
 */
export function getSupabaseAdmin() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    return null;
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
