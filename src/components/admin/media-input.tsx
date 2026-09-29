"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "@/components/providers/toast";
import { AdminImage } from "@/components/admin/admin-image";
import { isPreviewableUrl, isVideoUrl, uploadFile } from "@/components/admin/upload";
import { cn, youtubeId } from "@/lib/utils";

/**
 * Image / video field: upload a file (via /api/admin/upload) or paste a URL, with preview.
 * Submits the URL under `name`.
 */
export function MediaInput({
  name,
  id,
  defaultValue,
  folder = "misc",
  accept = "image/jpeg,image/png,image/webp,image/avif,image/gif",
  placeholder = "Paste an image URL or upload",
  aspect = "square",
  onChange,
}: {
  name: string;
  id?: string;
  defaultValue?: string | null;
  folder?: string;
  accept?: string;
  placeholder?: string;
  aspect?: "square" | "wide";
  onChange?: (url: string) => void;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (next: string) => {
    setUrl(next);
    onChange?.(next);
  };

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      update(await uploadFile(file, folder));
      toast("Uploaded");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const previewable = isPreviewableUrl(url);
  const yt = previewable ? youtubeId(url) : null;

  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl border border-line bg-mist",
          aspect === "square" ? "size-20" : "h-20 w-32",
        )}
      >
        {busy ? (
          <span className="absolute inset-0 grid place-items-center text-muted">
            <Loader2 className="size-5 animate-spin" />
          </span>
        ) : yt ? (
          <AdminImage src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="Video thumbnail" fill sizes="160px" className="object-cover" />
        ) : previewable && isVideoUrl(url) ? (
          <video src={url} className="size-full object-cover" muted playsInline preload="metadata" />
        ) : previewable ? (
          <AdminImage src={url} alt="Preview" fill sizes="160px" className="object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-zinc-400">
            <ImageIcon className="size-6" aria-hidden />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <input id={id ?? name} name={name} value={url} onChange={(e) => update(e.target.value)} placeholder={placeholder} className="field" autoComplete="off" />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold text-ink transition hover:border-ink disabled:opacity-50"
          >
            <Upload className="size-3.5" aria-hidden /> {busy ? "Uploading…" : "Upload"}
          </button>
          {url && (
            <button
              type="button"
              onClick={() => update("")}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted transition hover:bg-red-50 hover:text-red-600"
            >
              <X className="size-3.5" aria-hidden /> Remove
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} tabIndex={-1} aria-hidden />
      </div>
    </div>
  );
}
