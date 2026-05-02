"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type KioskPhase =
  | "idle"
  | "listening"
  | "matched"
  | "playing"
  | "ask_liked";

type TopStory = {
  id: string;
  summary: string | null;
  rating_positive: number;
  rating_negative: number;
};

export default function KioskPage() {
  const [phase, setPhase] = useState<KioskPhase>("idle");
  const [transcript, setTranscript] = useState("");
  const [matchedTitle, setMatchedTitle] = useState<string | null>(null);
  const [matchedSummary, setMatchedSummary] = useState<string | null>(null);
  const [fullStory, setFullStory] = useState<string | null>(null);
  const [topStories, setTopStories] = useState<TopStory[]>([]);
  const [topError, setTopError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stories/top");
        const data = (await res.json()) as { stories?: TopStory[]; error?: string };
        if (!cancelled) {
          if (!res.ok) {
            setTopError(data.error ?? "Could not load top stories.");
            return;
          }
          setTopStories(data.stories ?? []);
        }
      } catch {
        if (!cancelled) setTopError("Could not load top stories.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPhase("idle");
        setTranscript("");
        setMatchedTitle(null);
        setMatchedSummary(null);
        setFullStory(null);
        return;
      }

      if (phase === "idle" && !e.repeat) {
        setPhase("listening");
        setTranscript("(Live transcription will appear here — Pi service next.)");
        setMatchedTitle(null);
        setMatchedSummary(null);
        setFullStory(null);
        return;
      }

      if (phase === "ask_liked") {
        const k = e.key.toLowerCase();
        if (k === "y") {
          setPhase("idle");
          showToast("Thanks — liked (rating API next).");
        } else if (k === "n") {
          setPhase("idle");
          showToast("Thanks — not liked (rating API next).");
        }
      }
    },
    [phase, showToast],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  return (
    <div className="flex min-h-full flex-col font-sans md:flex-row">
      <aside className="border-b border-zinc-300 p-4 md:w-72 md:border-b-0 md:border-r md:border-zinc-300 dark:border-zinc-700">
        <h2 className="text-sm font-semibold">Best rated</h2>
        {topError ? (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{topError}</p>
        ) : topStories.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-500">No stories yet.</p>
        ) : (
          <ul className="mt-3 space-y-3 text-xs">
            {topStories.map((s) => (
              <li key={s.id} className="border-t border-zinc-200 pt-2 dark:border-zinc-800">
                <p className="text-zinc-800 dark:text-zinc-200">
                  {s.summary ?? "(no summary)"}
                </p>
                <p className="mt-1 text-zinc-500">
                  +{s.rating_positive} / −{s.rating_negative}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/"
          className="mt-6 inline-block text-xs text-zinc-600 underline dark:text-zinc-400"
        >
          Home
        </Link>
      </aside>

      <main className="flex min-h-[70vh] flex-1 flex-col justify-center px-6 py-10">
        {toast ? (
          <p className="mb-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {toast}
          </p>
        ) : null}

        {phase === "idle" ? (
          <div className="text-center">
            <p className="text-lg font-medium">Press any key to find a story</p>
            <p className="mt-2 text-sm text-zinc-500">
              Escape resets. Pi audio + Whisper hookup next.
            </p>
          </div>
        ) : null}

        {phase !== "idle" ? (
          <div className="mx-auto w-full max-w-2xl space-y-6">
            <section>
              <h3 className="text-xs font-medium uppercase text-zinc-500">
                Transcript
              </h3>
              <p className="mt-1 min-h-[3rem] rounded border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                {transcript}
              </p>
            </section>

            <section>
              <h3 className="text-xs font-medium uppercase text-zinc-500">
                Match
              </h3>
              <p className="mt-1 text-sm font-medium">
                {matchedTitle ?? "— (matched title from Pi / API)"}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {matchedSummary ?? "— (one-sentence summary)"}
              </p>
            </section>

            <section>
              <h3 className="text-xs font-medium uppercase text-zinc-500">
                Full story
              </h3>
              <p className="mt-1 min-h-[6rem] whitespace-pre-wrap rounded border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                {fullStory ?? "— (shown during playback)"}
              </p>
            </section>

            <section className="flex flex-wrap gap-4 text-sm">
              <button
                type="button"
                className="rounded border border-zinc-300 px-3 py-1.5 dark:border-zinc-600"
                onClick={() => {
                  setPhase("matched");
                  setMatchedTitle("Demo title");
                  setMatchedSummary("Demo summary line.");
                }}
              >
                Dev: fake match
              </button>
              <button
                type="button"
                className="rounded border border-zinc-300 px-3 py-1.5 dark:border-zinc-600"
                onClick={() => {
                  setPhase("playing");
                  setFullStory("Demo full story body for layout.");
                }}
              >
                Dev: fake playback
              </button>
              <button
                type="button"
                className="rounded border border-zinc-300 px-3 py-1.5 dark:border-zinc-600"
                onClick={() => setPhase("ask_liked")}
              >
                Dev: ask liked (Y/N)
              </button>
            </section>

            {phase === "ask_liked" ? (
              <p className="text-center text-sm font-medium">
                Did you like this story? Press Y or N
              </p>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
