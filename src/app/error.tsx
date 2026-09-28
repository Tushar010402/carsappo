"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-muted">An unexpected error occurred. Please try again — if it keeps happening, contact us on WhatsApp.</p>
      <div className="flex gap-3">
        <button onClick={reset} className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
          Try again
        </button>
        <Link href="/" className="rounded-full border border-line px-6 py-3 text-sm font-semibold">
          Go home
        </Link>
      </div>
    </div>
  );
}
