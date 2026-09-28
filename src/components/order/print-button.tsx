"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="no-print inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white">
      <Printer className="size-4" /> Print / Save as PDF
    </button>
  );
}
