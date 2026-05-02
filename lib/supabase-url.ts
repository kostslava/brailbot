/**
 * Supabase clients expect the project base URL only:
 *   https://<project-ref>.supabase.co
 *
 * The dashboard "API URL" is the same host. Opening that URL in a browser at path `/`
 * returns `{"error":"requested path is invalid"}` — that is normal; data lives under `/rest/v1/`.
 */
export function normalizeSupabaseUrl(input: string | undefined): string | null {
  if (!input) return null;
  let u = input.trim().replace(/\/+$/, "");
  if (!u.startsWith("https://")) return null;
  u = u.replace(/\/rest\/v1$/i, "");
  return u;
}
