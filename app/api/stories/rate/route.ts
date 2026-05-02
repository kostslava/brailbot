import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const id =
    typeof body === "object" && body !== null && "id" in body
      ? String((body as { id: unknown }).id)
      : "";
  const positive =
    typeof body === "object" && body !== null && "positive" in body
      ? Boolean((body as { positive: unknown }).positive)
      : true;

  if (!id) {
    return NextResponse.json({ error: "Missing story id." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
  }

  const col = positive ? "rating_positive" : "rating_negative";
  const { data } = await supabase
    .from("stories")
    .select(col)
    .eq("id", id)
    .single();

  if (!data) {
    return NextResponse.json({ error: "Story not found." }, { status: 404 });
  }

  const current = (data as Record<string, number>)[col] ?? 0;
  const { error } = await supabase
    .from("stories")
    .update({ [col]: current + 1 })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
