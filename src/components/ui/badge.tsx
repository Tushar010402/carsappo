import { cn } from "@/lib/utils";

const tones = {
  brand: "bg-brand text-ink",
  dark: "bg-ink text-white",
  soft: "bg-mist text-ink",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
  info: "bg-sky-50 text-sky-700",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "soft", className, children }: { tone?: BadgeTone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}
