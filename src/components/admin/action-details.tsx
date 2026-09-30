"use client";

import { useAdminFormState } from "@/components/admin/form";
import { cn } from "@/lib/utils";

const TONES = {
  info: "border-line bg-mist/60",
  warning: "border-amber-200 bg-amber-50",
  danger: "border-red-200 bg-red-50 text-red-800",
} as const;

/** Lists the `details` returned by the enclosing AdminForm's last submission (e.g. an import report). */
export function ActionDetails({ className }: { className?: string }) {
  const { state } = useAdminFormState();
  if (!state.details?.length) return null;
  return (
    <div className={cn("space-y-3", className)} aria-live="polite">
      {state.details.map((d) => (
        <section key={d.title} className={cn("rounded-xl border p-4", TONES[d.tone ?? "info"])}>
          <h3 className="text-sm font-semibold">{d.title}</h3>
          <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto font-mono text-xs">
            {d.lines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
