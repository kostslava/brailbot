import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type Row = {
  id: string;
  summary: string | null;
  rating_positive: number | null;
  rating_negative: number | null;
};

/**
 * Top-rated approved stories for the kiosk sidebar.
 */
export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { stories: [], error: "Supabase is not configured on the server." },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("stories")
    .select("id, summary, rating_positive, rating_negative")
    .eq("is_approved", true)
    .order("rating_positive", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(15);

  if (error) {
    if (error.code === "PGRST205") {
      return NextResponse.json({
        stories: [],
        error:
          "Stories table missing. Run supabase/migrations/20260502120000_create_stories.sql in Supabase.",
      });
    }
    return NextResponse.json(
      { stories: [], error: error.message },
      { status: 502 },
    );
  }

  const stories = (data ?? []).map((r: Row) => ({
    id: r.id,
    summary: r.summary,
    rating_positive: r.rating_positive ?? 0,
    rating_negative: r.rating_negative ?? 0,
  }));

  return NextResponse.json({ stories });
}
