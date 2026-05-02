import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeSupabaseUrl } from "@/lib/supabase-url";

/**
 * GET — quick check that env + DB are wired. Does not expose keys.
 * If the browser shows `{"error":"requested path is invalid"}` on the bare project URL, that is expected.
 */
export async function GET() {
  const base = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!base) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Set NEXT_PUBLIC_SUPABASE_URL to https://<project-ref>.supabase.co (copy from Dashboard → Connect or Settings → API).",
      },
      { status: 503 },
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        error: "Set SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY).",
      },
      { status: 503 },
    );
  }

  let host: string;
  try {
    host = new URL(base).host;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid NEXT_PUBLIC_SUPABASE_URL." }, { status: 503 });
  }

  const { error } = await admin.from("stories").select("id", { head: true, count: "exact" });

  if (error?.code === "PGRST205") {
    return NextResponse.json(
      {
        ok: false,
        host,
        error:
          "Table `public.stories` not found. Run supabase/migrations/20260502120000_create_stories.sql in the SQL Editor.",
      },
      { status: 503 },
    );
  }

  if (error) {
    return NextResponse.json(
      { ok: false, host, error: error.message },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    host,
    note:
      "Visiting https://<host>/ in a browser often shows requested path is invalid; the REST API is under /rest/v1/.",
  });
}
