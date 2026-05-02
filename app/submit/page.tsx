"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const PROMPT_TIPS = [
  "A character finds something unexpected in an old drawer.",
  "The last message before the power went out.",
  "Someone tells a lie that accidentally becomes true.",
  "A walk in the rain changes the day.",
  "The quietest room in the building.",
];

export default function SubmitPage() {
  const [rawText, setRawText] = useState("");
  const [tipIndex, setTipIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % PROMPT_TIPS.length);
    }, 8000);
    return () => window.clearInterval(id);
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);
      setStatus("loading");
      try {
        const res = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawText: rawText.trim() }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
          reason?: string;
        };
        if (!res.ok) {
          setStatus("error");
          const base =
            data.error ?? data.message ?? `Request failed (${res.status})`;
          const detail =
            typeof data.reason === "string" && data.reason.trim()
              ? ` ${data.reason.trim()}`
              : "";
          setMessage(`${base}${detail}`);
          return;
        }
        setStatus("done");
        setMessage(data.message ?? "Submitted.");
        setRawText("");
      } catch {
        setStatus("error");
        setMessage("Network error.");
      }
    },
    [rawText],
  );

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-6 px-4 py-8 font-sans md:flex-row md:px-8">
      <div className="md:w-56 md:shrink-0">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Prompt idea
        </p>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          {PROMPT_TIPS[tipIndex]}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← Home
        </Link>
      </div>

      <main className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold">Submit a story</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          No login. Text is sent to the API for moderation and classification
          (next step).
        </p>

        <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="story">
            Story text
          </label>
          <textarea
            id="story"
            name="story"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Write your short story here…"
            rows={14}
            className="w-full resize-y rounded border border-zinc-300 bg-white p-3 text-base outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-950"
            required
            minLength={10}
            disabled={status === "loading"}
          />
          <button
            type="submit"
            disabled={status === "loading" || rawText.trim().length < 10}
            className="self-start rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {status === "loading" ? "Submitting…" : "Submit"}
          </button>
        </form>

        {message ? (
          <p
            className={`mt-4 text-sm ${
              status === "error"
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-700 dark:text-zinc-300"
            }`}
            role="status"
          >
            {message}
          </p>
        ) : null}
      </main>
    </div>
  );
}
