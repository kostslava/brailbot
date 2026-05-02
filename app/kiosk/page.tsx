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
    <div className="flex min-h-screen" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Sidebar */}
      <aside
        className="flex w-72 shrink-0 flex-col border-r p-6"
        style={{
          borderColor: "var(--border-soft)",
          background: "rgba(21,21,21,0.6)",
        }}
      >
        <h2
          className="mb-1 font-medium"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.6rem",
            color: "var(--text)",
          }}
        >
          Best rated
        </h2>
        {topError ? (
          <p className="mt-3 text-xs" style={{ color: "#ef4444" }}>{topError}</p>
        ) : topStories.length === 0 ? (
          <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>No stories yet.</p>
        ) : (
          <ul className="mt-4 space-y-4 text-sm">
            {topStories.map((s) => (
              <li
                key={s.id}
                className="border-t pt-3"
                style={{ borderColor: "var(--border-soft)" }}
              >
                <p style={{ color: "var(--text-soft)" }}>
                  {s.summary ?? "(no summary)"}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  +{s.rating_positive} / −{s.rating_negative}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/"
          className="mt-auto pt-8 text-sm transition-opacity hover:opacity-80"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.1rem",
            color: "var(--text-muted)",
          }}
        >
          ← Home
        </Link>
      </aside>

      {/* Main content */}
      <main className="flex min-h-[70vh] flex-1 flex-col justify-center px-10 py-12">
        {toast ? (
          <p
            className="mb-6 text-center"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.1rem",
              color: "var(--text-muted)",
            }}
          >
            {toast}
          </p>
        ) : null}

        {phase === "idle" ? (
          <div className="text-center">
            <p
              className="font-medium"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                color: "var(--text)",
              }}
            >
              Press any key to find a story
            </p>
            <p
              className="mt-3"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.2rem",
                color: "var(--text-muted)",
              }}
            >
              Escape resets. Pi audio + Whisper hookup next.
            </p>
          </div>
        ) : null}

        {phase !== "idle" ? (
          <div className="mx-auto w-full max-w-2xl space-y-8">
            <section>
              <h3
                className="mb-2 text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Transcript
              </h3>
              <p
                className="min-h-[3rem] rounded-2xl p-4 text-sm"
                style={{
                  background: "var(--bg-soft)",
                  border: "1px solid var(--border-soft)",
                  color: "var(--text-soft)",
                }}
              >
                {transcript}
              </p>
            </section>

            <section>
              <h3
                className="mb-2 text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Match
              </h3>
              <p
                className="font-medium"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.4rem",
                  color: "var(--text)",
                }}
              >
                {matchedTitle ?? "— (matched title from Pi / API)"}
              </p>
              <p className="mt-1" style={{ color: "var(--text-soft)", fontSize: "1rem" }}>
                {matchedSummary ?? "— (one-sentence summary)"}
              </p>
            </section>

            <section>
              <h3
                className="mb-2 text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Full story
              </h3>
              <p
                className="min-h-[8rem] whitespace-pre-wrap rounded-2xl p-4 text-sm"
                style={{
                  background: "var(--bg-soft)",
                  border: "1px solid var(--border-soft)",
                  color: "var(--text-soft)",
                }}
              >
                {fullStory ?? "— (shown during playback)"}
              </p>
            </section>

            <section className="flex flex-wrap gap-4">
              {[
                {
                  label: "Dev: fake match",
                  onClick: () => {
                    setPhase("matched");
                    setMatchedTitle("Demo title");
                    setMatchedSummary("Demo summary line.");
                  },
                },
                {
                  label: "Dev: fake playback",
                  onClick: () => {
                    setPhase("playing");
                    setFullStory("Demo full story body for layout.");
                  },
                },
                {
                  label: "Dev: ask liked (Y/N)",
                  onClick: () => setPhase("ask_liked"),
                },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={btn.onClick}
                  className="rounded-full px-5 py-2 text-sm transition-transform hover:-translate-y-0.5"
                  style={{
                    background: "var(--bg-soft)",
                    color: "var(--text-soft)",
                    border: "1px solid var(--border-soft)",
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </section>

            {phase === "ask_liked" ? (
              <p
                className="text-center font-medium"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.4rem",
                  color: "var(--text)",
                }}
              >
                Did you like this story? Press Y or N
              </p>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
