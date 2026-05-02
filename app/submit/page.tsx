"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

export default function SubmitPage() {
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

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
        setTitle("");
      } catch {
        setStatus("error");
        setMessage("Network error.");
      }
    },
    [rawText],
  );

  return (
    <main
      className="flex min-h-screen items-start"
      style={{
        padding: "48px 0 72px",
        background:
          "radial-gradient(circle at 18% 82%, rgba(212,121,18,0.16) 0%, transparent 20%), radial-gradient(circle at 80% 20%, rgba(212,121,18,0.10) 0%, transparent 16%), var(--bg)",
      }}
    >
      <div className="mx-auto w-full px-5" style={{ maxWidth: 1040 }}>
        <Link
          href="/"
          className="mb-[34px] inline-block transition-opacity hover:opacity-85"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "2rem",
            color: "var(--text)",
          }}
        >
          ← Back
        </Link>

        <h1
          className="mb-[58px] text-center font-medium leading-[0.95]"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(3.2rem, 6vw, 5.4rem)",
          }}
        >
          Write your story
        </h1>

        <form
          className="flex flex-col items-center gap-[26px]"
          onSubmit={onSubmit}
        >
          <label htmlFor="storyTitle" className="sr-only">
            Story title
          </label>
          <input
            id="storyTitle"
            name="storyTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Story title"
            disabled={status === "loading"}
            className="w-full rounded-[36px] border border-transparent outline-none transition-all focus:border-[rgba(255,255,255,0.18)] focus:shadow-[0_0_0_4px_rgba(255,255,255,0.04)]"
            style={{
              minHeight: 88,
              padding: "0 32px",
              fontSize: "1.2rem",
              background: "var(--bg-soft)",
              color: "var(--text)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)",
            }}
          />

          <label htmlFor="storyText" className="sr-only">
            Story text
          </label>
          <textarea
            id="storyText"
            name="storyText"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Start writing your story here..."
            required
            minLength={10}
            disabled={status === "loading"}
            className="w-full resize-y rounded-[36px] border border-transparent outline-none transition-all focus:border-[rgba(255,255,255,0.18)] focus:shadow-[0_0_0_4px_rgba(255,255,255,0.04)]"
            style={{
              minHeight: 480,
              padding: "28px 32px",
              fontSize: "1.1rem",
              background: "var(--bg-soft)",
              color: "var(--text)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)",
            }}
          />

          <button
            type="submit"
            disabled={status === "loading" || rawText.trim().length < 10}
            className="mt-[18px] inline-flex items-center justify-center rounded-full font-semibold shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.8rem",
              minWidth: 220,
              minHeight: 68,
              padding: "16px 34px",
              background: "var(--button-bg)",
              color: "var(--button-text)",
            }}
          >
            {status === "loading" ? "Submitting…" : "Submit story"}
          </button>
        </form>

        {message ? (
          <p
            className="mt-6 text-center"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.2rem",
              color:
                status === "error"
                  ? "#ef4444"
                  : "var(--text-soft)",
            }}
            role="status"
          >
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}
