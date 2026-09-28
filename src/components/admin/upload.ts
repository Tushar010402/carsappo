/** Uploads a file through the admin upload API and returns its public URL. */
export async function uploadFile(file: File, folder: string): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error || `Upload failed (${res.status})`);
  return data.url;
}

/** True when a string can be rendered as an image/video preview. */
export function isPreviewableUrl(url: string) {
  if (!url) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export const isVideoUrl = (url: string) => /\.(mp4|webm)(\?|#|$)/i.test(url);
