const DEFAULT_BASE_URL = "https://app.backboard.io/api";

type BackboardMessageResponse = {
  content?: string | null;
  status?: string;
  message?: string;
};

function parseJsonFromAssistantText<T>(text: string): T {
  let s = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(s);
  if (fence) s = fence[1].trim();
  return JSON.parse(s) as T;
}

export async function backboardCompleteJson<T>(opts: {
  systemPrompt: string;
  userText: string;
}): Promise<T> {
  const apiKey = process.env.BACKBOARD_API_KEY;
  if (!apiKey) {
    throw new Error("BACKBOARD_API_KEY is not set.");
  }

  const baseUrl = (
    process.env.BACKBOARD_BASE_URL || DEFAULT_BASE_URL
  ).replace(/\/$/, "");
  const modelName = process.env.BACKBOARD_MODEL || "gpt-5.4-mini";
  const llmProvider = process.env.BACKBOARD_LLM_PROVIDER || "openai";

  const res = await fetch(`${baseUrl}/threads/messages`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system_prompt: opts.systemPrompt,
      content: opts.userText,
      stream: false,
      json_output: true,
      memory: "off",
      llm_provider: llmProvider,
      model_name: modelName,
    }),
  });

  const raw = (await res.json().catch(() => ({}))) as BackboardMessageResponse &
    Record<string, unknown>;

  if (!res.ok) {
    const detail =
      typeof raw.message === "string"
        ? raw.message
        : typeof raw.detail === "string"
          ? raw.detail
          : res.statusText;
    throw new Error(`Backboard HTTP ${res.status}: ${detail}`);
  }

  if (raw.status === "FAILED") {
    throw new Error(raw.message || "Backboard run FAILED.");
  }

  const text = raw.content?.trim();
  if (!text) {
    throw new Error("Backboard returned empty content.");
  }

  try {
    return parseJsonFromAssistantText<T>(text);
  } catch {
    throw new Error(`Could not parse model JSON: ${text.slice(0, 200)}`);
  }
}

export type ModerationJson = { approved: boolean; reason: string };

export type ClassificationJson = {
  theme: string;
  age_group: string;
  mood: string;
  summary: string;
  clean_text: string;
};
