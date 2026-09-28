"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "@/components/providers/toast";
import { AdminImage } from "@/components/admin/admin-image";
import { isPreviewableUrl, uploadFile } from "@/components/admin/upload";
import { cn } from "@/lib/utils";

export type ImageRow = { url: string; alt: string };

/** Product gallery editor: multi-upload, add by URL, alt text, reorder (first = cover), delete. */
export function ImagesEditor({ name, defaultValue, folder = "products" }: { name: string; defaultValue: ImageRow[]; folder?: string }) {
  const seq = useRef(defaultValue.length);
  const [rows, setRows] = useState(() => defaultValue.map((img, i) => ({ key: i, ...img })));
  const [uploading, setUploading] = useState(0);
  const [urlDraft, setUrlDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const add = (url: string) => setRows((r) => [...r, { key: seq.current++, url, alt: "" }]);
  const moveBy = (i: number, d: number) =>
    setRows((r) => {
      const j = i + d;
      if (j < 0 || j >= r.length) return r;
      const next = [...r];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files].slice(0, 12);
    setUploading(list.length);
    for (const file of list) {
      try {
        add(await uploadFile(file, folder));
      } catch (err) {
        toast(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`, "error");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function addUrl() {
    const url = urlDraft.trim();
    if (!isPreviewableUrl(url)) {
      toast("Enter a full image URL starting with https://", "error");
      return;
    }
    add(url);
    setUrlDraft("");
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows.map(({ url, alt }) => ({ url, alt: alt.trim() })))} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((row, i) => (
          <div key={row.key} className={cn("group overflow-hidden rounded-xl border bg-paper", i === 0 ? "border-ink" : "border-line")}>
            <div className="relative aspect-square bg-mist">
              {isPreviewableUrl(row.url) && <AdminImage src={row.url} alt={row.alt || "Product image"} fill sizes="200px" className="object-cover" />}
              {i === 0 && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-brand">
                  <Star className="size-3 fill-current" /> Cover
                </span>
              )}
              <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveBy(i, -1)} disabled={i === 0} className="grid size-7 place-items-center rounded-lg bg-white/95 text-ink shadow disabled:opacity-40" aria-label="Move left">
                    <ArrowLeft className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => moveBy(i, 1)} disabled={i === rows.length - 1} className="grid size-7 place-items-center rounded-lg bg-white/95 text-ink shadow disabled:opacity-40" aria-label="Move right">
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
                <button type="button" onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))} className="grid size-7 place-items-center rounded-lg bg-white/95 text-red-600 shadow" aria-label="Delete image">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            <input
              value={row.alt}
              onChange={(e) => setRows((r) => r.map((x) => (x.key === row.key ? { ...x, alt: e.target.value } : x)))}
              placeholder="Alt text (for SEO)"
              aria-label={`Alt text for image ${i + 1}`}
              className="w-full border-t border-line px-2.5 py-2 text-xs outline-none focus:bg-brand-soft/40"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading > 0}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line text-sm font-medium text-muted transition hover:border-ink hover:text-ink disabled:opacity-60"
        >
          {uploading > 0 ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          {uploading > 0 ? `Uploading ${uploading}…` : "Upload images"}
        </button>
      </div>
      <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="hidden" onChange={(e) => onFiles(e.target.files)} tabIndex={-1} aria-hidden />
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="…or paste an image URL"
            aria-label="Image URL"
            className="field py-2 pl-9"
          />
        </div>
        <button type="button" onClick={addUrl} className="rounded-xl border border-line px-4 text-sm font-semibold hover:border-ink">
          Add
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">JPG, PNG, WEBP or AVIF up to 5 MB. The first image is the cover shown in listings. Use square images (1:1) for best results.</p>
    </div>
  );
}
