import type { Testimonial } from "@prisma/client";
import { Quote } from "lucide-react";
import { Stars } from "@/components/ui/stars";
import { SmartImage } from "@/components/ui/smart-image";
import { GoogleIcon } from "@/components/icons/brand";
import { Tabs } from "@/components/home/tabs";
import { Rail } from "@/components/product/product-rail";
import { VideoCard } from "@/components/home/video-card";
import type { GoogleReview } from "@/lib/social";

function ImageReview({ t }: { t: Testimonial }) {
  return (
    <figure className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
      {t.mediaUrl && (
        <div className="relative aspect-[4/3] bg-mist">
          <SmartImage src={t.mediaUrl} alt={`Photo shared by ${t.name}`} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <Stars rating={t.rating} />
        <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-zinc-700">“{t.content}”</blockquote>
        <figcaption className="mt-4 text-sm font-semibold">
          {t.name}
          {t.location && <span className="font-normal text-muted"> · {t.location}</span>}
        </figcaption>
      </div>
    </figure>
  );
}

function GoogleCard({ name, rating, text, meta }: { name: string; rating: number; text: string; meta?: string | null }) {
  return (
    <figure className="flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-mist font-display font-semibold">{name.charAt(0)}</span>
          <div>
            <p className="text-sm font-semibold">{name}</p>
            {meta && <p className="text-xs text-muted">{meta}</p>}
          </div>
        </div>
        <GoogleIcon className="size-5" />
      </div>
      <Stars rating={rating} className="mt-4" />
      <blockquote className="mt-3 line-clamp-6 text-sm leading-relaxed text-zinc-700">{text}</blockquote>
    </figure>
  );
}

export function CustomerReviews({
  testimonials,
  google,
  googleUrl,
}: {
  testimonials: Testimonial[];
  google: { rating: number; total: number; reviews: GoogleReview[] } | null;
  googleUrl?: string;
}) {
  const images = testimonials.filter((t) => t.type === "IMAGE");
  const videos = testimonials.filter((t) => t.type === "VIDEO" && t.mediaUrl);
  const googleCards = google?.reviews.length
    ? google.reviews.map((r, i) => <GoogleCard key={i} name={r.author} rating={r.rating} text={r.text} meta={r.relativeTime} />)
    : testimonials.filter((t) => t.type === "GOOGLE").map((t) => <GoogleCard key={t.id} name={t.name} rating={t.rating} text={t.content} meta={t.location} />);

  const tabs = [
    images.length && { id: "image", label: "Image Reviews", content: <Rail>{images.map((t) => <ImageReview key={t.id} t={t} />)}</Rail> },
    videos.length && {
      id: "video",
      label: "Video Reviews",
      content: (
        <Rail itemClassName="!w-[62%] sm:!w-[31%] lg:!w-[23.5%]">
          {videos.map((t) => (
            <figure key={t.id}>
              <VideoCard url={t.mediaUrl!} title={`Review by ${t.name}`} />
              <figcaption className="mt-3 text-sm">
                <span className="font-semibold">{t.name}</span> <span className="text-muted">— {t.content}</span>
              </figcaption>
            </figure>
          ))}
        </Rail>
      ),
    },
    googleCards.length && { id: "google", label: "Google Reviews", content: <Rail>{googleCards}</Rail> },
  ].filter(Boolean) as { id: string; label: string; content: React.ReactNode }[];

  if (!tabs.length) return null;

  return (
    <div>
      {google && google.total > 0 && (
        <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-line px-4 py-2">
          <GoogleIcon className="size-5" />
          <span className="font-display font-semibold">{google.rating.toFixed(1)}</span>
          <Stars rating={google.rating} />
          <span className="text-sm text-muted">{google.total} Google reviews</span>
          {googleUrl && (
            <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold underline">
              Write a review
            </a>
          )}
        </div>
      )}
      <Tabs tabs={tabs} />
      <Quote className="sr-only" aria-hidden />
    </div>
  );
}
