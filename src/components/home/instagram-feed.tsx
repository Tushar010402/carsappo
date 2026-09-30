import { Play } from "lucide-react";
import { InstagramIcon } from "@/components/icons/brand";
import { SmartImage } from "@/components/ui/smart-image";
import { buttonClasses } from "@/components/ui/button";
import type { InstagramPost } from "@/lib/social";

export function InstagramFeed({
  posts,
  profileUrl,
  fallbackImages,
  title,
  subtitle,
}: {
  posts: InstagramPost[];
  profileUrl: string;
  fallbackImages: string[];
  title: string;
  subtitle: string;
}) {
  const handle = profileUrl.replace(/\/$/, "").split("/").pop() || "carsappo";
  const tiles = posts.length
    ? posts.slice(0, 8).map((p) => ({ key: p.id, href: p.permalink, img: p.imageUrl, alt: p.caption.slice(0, 80) || "Instagram post", video: p.mediaType === "VIDEO" }))
    : fallbackImages.slice(0, 8).map((img, i) => ({ key: String(i), href: profileUrl, img, alt: `${title} on Instagram`, video: i % 3 === 1 }));

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-3">@{handle}</p>
          <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
          {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
        </div>
        <a href={profileUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses("dark")}>
          <InstagramIcon className="size-4" /> Follow on Instagram
        </a>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <a
            key={t.key}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded-2xl bg-mist"
          >
            <SmartImage src={t.img} alt={t.alt} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 grid place-items-center bg-ink/0 opacity-0 transition group-hover:bg-ink/40 group-hover:opacity-100">
              <InstagramIcon className="size-8 text-white" />
            </span>
            {t.video && (
              <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-ink/60 text-white">
                <Play className="size-3.5 fill-current" />
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
