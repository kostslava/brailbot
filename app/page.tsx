import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center gap-8 px-6 py-16 font-sans">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">StoryBox</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Community stories for the web and kiosk. Scaffold — styling comes next.
        </p>
      </header>
      <nav className="flex flex-col gap-3 text-sm">
        <Link
          className="rounded border border-zinc-300 px-4 py-3 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          href="/submit"
        >
          Submit a story →
        </Link>
        <Link
          className="rounded border border-zinc-300 px-4 py-3 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          href="/kiosk"
        >
          Kiosk (Pi display) →
        </Link>
      </nav>
    </div>
  );
}
