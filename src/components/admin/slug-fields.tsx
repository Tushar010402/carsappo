"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { FormField } from "@/components/admin/form";
import { slugify } from "@/lib/utils";

/**
 * Name + URL slug pair. The slug follows the name until it is edited by hand
 * (existing records keep their slug unless changed explicitly, to avoid breaking links).
 */
export function SlugFields({
  nameField = "name",
  nameLabel = "Name",
  defaultName = "",
  defaultSlug = "",
  prefix = "/",
  namePlaceholder,
}: {
  nameField?: string;
  nameLabel?: string;
  defaultName?: string;
  defaultSlug?: string;
  prefix?: string;
  namePlaceholder?: string;
}) {
  const [name, setName] = useState(defaultName);
  const [slug, setSlug] = useState(defaultSlug);
  const [linked, setLinked] = useState(!defaultSlug);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField name={nameField} label={nameLabel}>
        <input
          id={nameField}
          name={nameField}
          className="field"
          value={name}
          required
          placeholder={namePlaceholder}
          onChange={(e) => {
            setName(e.target.value);
            if (linked) setSlug(slugify(e.target.value));
          }}
        />
      </FormField>
      <FormField name="slug" label="URL slug" hint={<span className="font-mono">{prefix}{slug || "…"}</span>}>
        <div className="relative">
          <input
            id="slug"
            name="slug"
            className="field pr-10 font-mono text-[13px]"
            value={slug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title="Lowercase letters, numbers and hyphens"
            onChange={(e) => {
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
              setLinked(false);
            }}
          />
          <button
            type="button"
            onClick={() => {
              setSlug(slugify(name));
              setLinked(true);
            }}
            className="absolute inset-y-0 right-1 my-auto grid size-8 place-items-center rounded-lg text-muted hover:bg-mist hover:text-ink"
            aria-label="Generate slug from name"
            title="Generate from name"
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>
      </FormField>
    </div>
  );
}
