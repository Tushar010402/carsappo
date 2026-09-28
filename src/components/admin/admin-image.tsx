import type { ImageProps } from "next/image";
import { SmartImage } from "@/components/ui/smart-image";

/**
 * SmartImage for admin previews: remote URLs pasted by admins are shown unoptimized so an
 * unknown host never breaks the page (next/image rejects hosts missing from remotePatterns).
 */
export function AdminImage({ src, alt, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  const local = src.startsWith("/") && !src.startsWith("//");
  return <SmartImage src={src} alt={alt} unoptimized={!local || /\.svg(\?|$)/i.test(src)} {...props} />;
}
