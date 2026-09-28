"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Play, X } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { VideoCard } from "@/components/home/video-card";
import { cn, youtubeId } from "@/lib/utils";

type Img = { url: string; alt: string | null };

export function ProductGallery({ images, name, videoUrl }: { images: Img[]; name: string; videoUrl?: string | null }) {
  const slides: ({ kind: "image"; img: Img } | { kind: "video"; url: string })[] = [
    ...images.map((img) => ({ kind: "image" as const, img })),
    ...(videoUrl ? [{ kind: "video" as const, url: videoUrl }] : []),
  ];
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const current = slides[index];
  const go = (d: number) => setIndex((i) => (i + d + slides.length) % slides.length);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % slides.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + slides.length) % slides.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, slides.length]);

  if (!slides.length) return <div className="aspect-square rounded-[28px] bg-mist" />;

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      <div className="no-scrollbar flex gap-2 overflow-x-auto md:max-h-[560px] md:w-20 md:flex-col md:overflow-y-auto">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={s.kind === "video" ? "Play product video" : `View image ${i + 1}`}
            className={cn(
              "relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-mist md:w-full",
              i === index ? "border-ink" : "border-transparent opacity-70 hover:opacity-100",
            )}
          >
            {s.kind === "image" ? (
              <SmartImage src={s.img.url} alt="" fill sizes="80px" className="object-cover" />
            ) : (
              <span className="grid h-full place-items-center bg-ink text-brand">
                <Play className="size-5 fill-current" />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="relative flex-1">
        {current.kind === "image" ? (
          <div
            className="relative aspect-square cursor-zoom-in overflow-hidden rounded-[28px] bg-mist"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
            }}
            onMouseLeave={() => setZoom(null)}
            onClick={() => setLightbox(true)}
          >
            <SmartImage
              src={current.img.url}
              alt={current.img.alt || name}
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover transition-transform duration-200"
              style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
            <span className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium backdrop-blur">
              <Expand className="size-3.5" /> Hover to zoom · click to expand
            </span>
          </div>
        ) : (
          <div className="mx-auto max-w-sm">
            {youtubeId(current.url) || /\.(mp4|webm)/i.test(current.url) ? <VideoCard url={current.url} title={`${name} video`} /> : null}
          </div>
        )}
        {slides.length > 1 && (
          <div className="pointer-events-none absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between md:hidden">
            <button onClick={() => go(-1)} className="pointer-events-auto grid size-9 place-items-center rounded-full bg-white/90 shadow" aria-label="Previous image">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => go(1)} className="pointer-events-auto grid size-9 place-items-center rounded-full bg-white/90 shadow" aria-label="Next image">
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {lightbox && current.kind === "image" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-4" role="dialog" aria-modal="true" aria-label="Image viewer">
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-white/10 text-white" aria-label="Close">
            <X className="size-5" />
          </button>
          {slides.length > 1 && (
            <>
              <button onClick={() => go(-1)} className="absolute left-4 grid size-11 place-items-center rounded-full bg-white/10 text-white" aria-label="Previous">
                <ChevronLeft className="size-5" />
              </button>
              <button onClick={() => go(1)} className="absolute right-4 grid size-11 place-items-center rounded-full bg-white/10 text-white" aria-label="Next">
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
          <div className="relative aspect-square w-full max-w-3xl">
            <SmartImage src={current.img.url} alt={current.img.alt || name} fill sizes="90vw" className="rounded-2xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
