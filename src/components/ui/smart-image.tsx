import Image, { type ImageProps } from "next/image";

const OPTIMIZABLE_HOSTS = [
  "images.unsplash.com",
  "res.cloudinary.com",
  "i.ytimg.com",
  "lh3.googleusercontent.com",
  "scontent.cdninstagram.com",
];

function canOptimize(src: string) {
  if (src.endsWith(".svg") || src.startsWith("data:")) return false;
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname;
    const s3 = process.env.NEXT_PUBLIC_S3_PUBLIC_HOST;
    return OPTIMIZABLE_HOSTS.includes(host) || host.endsWith(".cdninstagram.com") || (!!s3 && host === s3);
  } catch {
    return false;
  }
}

/** next/image that falls back to unoptimized delivery for SVGs and unknown hosts. */
export function SmartImage({ src, alt, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  return <Image src={src} alt={alt} unoptimized={!canOptimize(src)} {...props} />;
}
