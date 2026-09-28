"use client";

import { useState } from "react";
import type { TestimonialType } from "@prisma/client";
import { saveTestimonial } from "@/app/admin/_actions/reviews";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";
import { Toggle } from "@/components/admin/ui";

export type TestimonialFormValues = {
  id?: string;
  type: TestimonialType;
  name: string;
  location: string;
  rating: number;
  content: string;
  mediaUrl: string;
  sortOrder: number;
  isActive: boolean;
};

const MEDIA_HINT: Record<TestimonialType, string> = {
  IMAGE: "Customer photo (with their car / installed product).",
  VIDEO: "Paste a YouTube / Shorts link, or upload an MP4 (max 40 MB).",
  GOOGLE: "Optional reviewer avatar.",
};

export function TestimonialForm({ testimonial }: { testimonial: TestimonialFormValues }) {
  const [type, setType] = useState<TestimonialType>(testimonial.type);
  return (
    <AdminForm action={saveTestimonial} className="space-y-4">
      {testimonial.id && <input type="hidden" name="id" value={testimonial.id} />}
      <FormField name="type" label="Type">
        <div className="grid grid-cols-3 gap-2" role="radiogroup">
          {(["IMAGE", "VIDEO", "GOOGLE"] as const).map((t) => (
            <label key={t} className="cursor-pointer rounded-xl border border-line px-3 py-2 text-center text-sm font-medium has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white">
              <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
              {t === "IMAGE" ? "Image review" : t === "VIDEO" ? "Video review" : "Google review"}
            </label>
          ))}
        </div>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_6rem]">
        <FormField name="name" label="Customer name">
          <input id="name" name="name" className="field" defaultValue={testimonial.name} required maxLength={80} />
        </FormField>
        <FormField name="location" label="Location / car">
          <input id="location" name="location" className="field" defaultValue={testimonial.location} maxLength={80} placeholder="Greater Noida · Creta" />
        </FormField>
        <FormField name="rating" label="Rating">
          <select id="rating" name="rating" className="field" defaultValue={testimonial.rating}>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} ★
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField name="content" label="Review">
        <textarea id="content" name="content" className="field min-h-24" defaultValue={testimonial.content} required maxLength={1500} />
      </FormField>
      <FormField name="mediaUrl" label={type === "VIDEO" ? "Video" : type === "IMAGE" ? "Photo" : "Avatar"} hint={MEDIA_HINT[type]}>
        <MediaInput
          key={type}
          name="mediaUrl"
          defaultValue={testimonial.type === type ? testimonial.mediaUrl : ""}
          folder="testimonials"
          accept={type === "VIDEO" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/avif"}
          placeholder={type === "VIDEO" ? "https://youtube.com/shorts/… or upload" : "Paste an image URL or upload"}
        />
      </FormField>
      <div className="grid items-end gap-4 sm:grid-cols-2">
        <FormField name="sortOrder" label="Sort order">
          <input id="sortOrder" name="sortOrder" type="number" className="field" defaultValue={testimonial.sortOrder} required />
        </FormField>
        <Toggle name="isActive" label="Show on homepage" defaultChecked={testimonial.isActive} className="pb-2" />
      </div>
      <FormError />
      <div className="flex justify-end">
        <FormSubmit>{testimonial.id ? "Save" : "Add testimonial"}</FormSubmit>
      </div>
    </AdminForm>
  );
}
