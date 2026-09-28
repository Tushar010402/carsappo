"use client";

import { Copy } from "lucide-react";
import { useCart } from "@/store/cart";
import { toast } from "@/components/providers/toast";

export function CopyCode({ code }: { code: string }) {
  const setCoupon = useCart((s) => s.setCoupon);
  return (
    <button
      onClick={() => {
        setCoupon(code);
        void navigator.clipboard?.writeText(code).catch(() => {});
        toast(`${code} will be applied at checkout`, "success", { label: "Go to cart", href: "/cart" });
      }}
      className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold text-white"
    >
      <Copy className="size-3.5" /> Apply to cart
    </button>
  );
}
