"use client";

import { createContext, useCallback, useContext, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogApi = { close: () => void };

const DialogContext = createContext<DialogApi | null>(null);

/** Lets forms inside a dialog close it after a successful save. */
export function useDialog() {
  return useContext(DialogContext);
}

/**
 * Modal built on the native <dialog> element. Content mounts only while open,
 * so every opening starts with a fresh form.
 */
export function FormDialog({
  trigger,
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerClassName,
  triggerLabel,
  title,
  description,
  children,
  size = "md",
}: {
  trigger: ReactNode;
  triggerVariant?: ButtonVariant | "icon" | "link";
  triggerSize?: ButtonSize;
  triggerClassName?: string;
  /** Accessible label when the trigger is icon-only. */
  triggerLabel?: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const close = useCallback(() => ref.current?.close(), []);

  const triggerCls =
    triggerVariant === "icon"
      ? "inline-grid size-8 place-items-center rounded-lg text-muted transition hover:bg-mist hover:text-ink"
      : triggerVariant === "link"
        ? "font-medium text-ink underline-offset-4 hover:underline"
        : buttonClasses(triggerVariant, triggerSize);

  return (
    <>
      <button
        type="button"
        className={cn(triggerCls, triggerClassName)}
        aria-label={triggerLabel}
        title={triggerLabel}
        onClick={() => {
          setOpen(true);
          ref.current?.showModal();
        }}
      >
        {trigger}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // Click on the backdrop closes the dialog.
          if (e.target === e.currentTarget) close();
        }}
        className={cn(
          "m-auto max-h-[92vh] w-[calc(100%-1.5rem)] overflow-hidden rounded-2xl border border-line bg-paper p-0 text-ink shadow-lift backdrop:bg-ink/55 backdrop:backdrop-blur-[2px]",
          size === "md" && "max-w-lg",
          size === "lg" && "max-w-2xl",
          size === "xl" && "max-w-4xl",
        )}
      >
        {open && (
          <DialogContext.Provider value={{ close }}>
            <div className="flex max-h-[92vh] flex-col">
              <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                <div>
                  <h2 id={titleId} className="font-display text-lg font-semibold">
                    {title}
                  </h2>
                  {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
                </div>
                <button type="button" onClick={close} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-mist hover:text-ink" aria-label="Close">
                  <X className="size-4" />
                </button>
              </header>
              <div className="overflow-y-auto px-5 py-5">{children}</div>
            </div>
          </DialogContext.Provider>
        )}
      </dialog>
    </>
  );
}
