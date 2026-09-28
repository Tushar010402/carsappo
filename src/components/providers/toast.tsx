"use client";

import { useEffect, useRef } from "react";
import { create } from "zustand";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = { id: number; message: string; tone: "success" | "error"; action?: { label: string; href: string } };

type ToastState = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
};

let counter = 0;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(message: string, tone: Toast["tone"] = "success", action?: Toast["action"]) {
  useToast.getState().push({ message, tone, action });
}

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const ref = useRef<HTMLDivElement>(null);

  // Render in the browser's top layer (popover) so toasts stay visible above open modal <dialog>s.
  // Re-showing moves it to the top of the top-layer stack each time a toast arrives.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.showPopover !== "function") return;
    try {
      if (el.matches(":popover-open")) el.hidePopover();
      if (toasts.length) el.showPopover();
    } catch {
      /* popover unsupported — falls back to fixed positioning */
    }
  }, [toasts]);

  return (
    <div
      ref={ref}
      popover="manual"
      className="pointer-events-none fixed inset-x-0 top-auto bottom-4 z-[100] m-0 flex h-auto w-full max-w-none flex-col items-center gap-2 overflow-visible border-0 bg-transparent p-0 px-4 sm:bottom-6 [&:not(:popover-open)]:hidden"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm animate-fade-up items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-lift",
          )}
        >
          {t.tone === "success" ? (
            <CheckCircle2 className="size-5 shrink-0 text-brand" />
          ) : (
            <CircleAlert className="size-5 shrink-0 text-red-400" />
          )}
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <a href={t.action.href} className="font-semibold text-brand hover:underline">
              {t.action.label}
            </a>
          )}
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-zinc-400 hover:text-white">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
