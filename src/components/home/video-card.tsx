"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { youtubeId } from "@/lib/utils";

export function VideoCard({ url, title }: { url: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const yt = youtubeId(url);
  const isFile = /\.(mp4|webm)(\?|$)/i.test(url);

  if (isFile) {
    return <video src={url} controls preload="metadata" className="aspect-[9/16] w-full rounded-2xl bg-ink object-cover" aria-label={title} />;
  }
  if (!yt) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="grid aspect-[9/16] w-full place-items-center rounded-2xl bg-ink text-white">
        <span className="flex flex-col items-center gap-2 text-sm">
          <Play className="size-8 text-brand" /> Watch video
        </span>
      </a>
    );
  }
  return playing ? (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`}
      title={title}
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      className="aspect-[9/16] w-full rounded-2xl bg-ink"
    />
  ) : (
    <button onClick={() => setPlaying(true)} className="group relative block aspect-[9/16] w-full overflow-hidden rounded-2xl bg-ink" aria-label={`Play video: ${title}`}>
      <SmartImage src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="" fill sizes="300px" className="object-cover opacity-80 transition group-hover:scale-105" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-14 place-items-center rounded-full bg-brand text-ink shadow-lift transition group-hover:scale-110">
          <Play className="size-6 fill-current" />
        </span>
      </span>
    </button>
  );
}
