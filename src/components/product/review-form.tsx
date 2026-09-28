"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/app/actions/forms";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validators";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId, defaultName }: { productId: string; defaultName?: string }) {
  const [state, action] = useActionState<FormState, FormData>(submitReview, {});
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (state.ok) return <FormMessage state={state} />;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <Field label="Your rating" error={state.errors?.rating}>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
            >
              <Star className={cn("size-7 transition", (hover || rating) >= n ? "fill-brand-dark text-brand-dark" : "text-zinc-300")} />
            </button>
          ))}
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={state.errors?.name} htmlFor="rv-name">
          <Input id="rv-name" name="name" defaultValue={defaultName} required invalid={!!state.errors?.name} />
        </Field>
        <Field label="Title (optional)" htmlFor="rv-title">
          <Input id="rv-title" name="title" placeholder="Summarise your experience" />
        </Field>
      </div>
      <Field label="Review" error={state.errors?.body} htmlFor="rv-body">
        <Textarea id="rv-body" name="body" required placeholder="How was the fit, quality and finish?" invalid={!!state.errors?.body} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton variant="dark" pendingText="Submitting…">
        Submit review
      </SubmitButton>
    </form>
  );
}
