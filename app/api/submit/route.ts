import { NextResponse } from "next/server";
import {
  backboardCompleteJson,
  type ClassificationJson,
  type ModerationJson,
} from "@/lib/backboard";
import { coerceClassification } from "@/lib/story-enums";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MODERATION_SYSTEM = `You are a lightweight safety filter for a hackathon story booth (not a school essay grader).

Default: APPROVE. When unsure, APPROVE.

ALLOW freely: jokes, satire, absurdist or meme-y writing, internet slang, mild crude humor, fake news parody, silly violence (cartoonish), PG-13 flirting, mild profanity, "edgy but not hateful" tone.

REJECT only for clear, serious harm:
- Slurs, demeaning hate, or attacks aimed at race, religion, gender, sexuality, disability, ethnicity, or other protected groups.
- Credible threats, harassment of a real identifiable person, or instructions for serious crimes, terrorism, or self-harm.
- Sexual content involving minors; explicit pornographic step-by-step description.
- Extreme torture/gore porn aimed at shock.

Do NOT reject for: nonsense phrases, looksmaxxing / brainrot meme vocabulary, college/frat jokes, emoji, or "immature" tone.

Respond with JSON ONLY (no markdown):
{"approved": true|false, "reason": "short reason; empty string if approved"}`;

const CLASSIFY_SYSTEM = `You classify short fiction for a storytelling app.
Respond with a JSON object ONLY (no markdown) with these exact keys:
- "theme": one of adventure, mystery, romance, comedy, horror, history, nature, motivational
- "age_group": one of children, teen, adult (best fit for content and vocabulary)
- "mood": one of uplifting, dark, funny, emotional, neutral
- "summary": one clear English sentence summarizing the story
- "clean_text": the story text lightly edited for spelling/grammar and readability; preserve meaning and voice; same language as input`;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawText =
    typeof body === "object" &&
    body !== null &&
    "rawText" in body &&
    typeof (body as { rawText: unknown }).rawText === "string"
      ? (body as { rawText: string }).rawText.trim()
      : "";

  if (rawText.length < 10) {
    return NextResponse.json(
      { error: "Story must be at least 10 characters." },
      { status: 400 },
    );
  }

  let moderation: ModerationJson;
  try {
    moderation = await backboardCompleteJson<ModerationJson>({
      systemPrompt: MODERATION_SYSTEM,
      userText: rawText,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Moderation request failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  if (!moderation.approved) {
    return NextResponse.json(
      {
        error: "This story can’t be published.",
        reason:
          typeof moderation.reason === "string" && moderation.reason.trim()
            ? moderation.reason.trim()
            : "Content did not pass moderation.",
      },
      { status: 422 },
    );
  }

  let classificationRaw: ClassificationJson;
  try {
    classificationRaw = await backboardCompleteJson<ClassificationJson>({
      systemPrompt: CLASSIFY_SYSTEM,
      userText: rawText,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Classification request failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const row = coerceClassification(classificationRaw);

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Server missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL (https://…supabase.co) and SUPABASE_SECRET_KEY (sb_secret_…) or legacy SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("stories")
    .insert({
      raw_text: rawText,
      clean_text: row.clean_text || rawText,
      theme: row.theme,
      age_group: row.age_group,
      mood: row.mood,
      summary: row.summary,
      is_approved: true,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message || "Database insert failed." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    message: "Your story was published.",
    id: data.id,
  });
}
