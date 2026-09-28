"use client";

import { Link2 } from "lucide-react";
import { FacebookIcon, WhatsappIcon, XIcon } from "@/components/icons/brand";
import { toast } from "@/components/providers/toast";
import { absoluteUrl } from "@/lib/utils";

export function ShareButtons({ title, path }: { title: string; path: string }) {
  const url = absoluteUrl(path);
  const btn = "grid size-10 place-items-center rounded-full border border-line hover:border-ink";
  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-sm text-muted">Share</span>
      <a className={btn} href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">
        <WhatsappIcon className="size-4" />
      </a>
      <a className={btn} href={`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
        <XIcon className="size-4" />
      </a>
      <a className={btn} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
        <FacebookIcon className="size-4" />
      </a>
      <button
        className={btn}
        aria-label="Copy link"
        onClick={() => {
          void navigator.clipboard?.writeText(window.location.href);
          toast("Link copied");
        }}
      >
        <Link2 className="size-4" />
      </button>
    </div>
  );
}
