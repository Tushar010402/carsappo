"use client";

import { useEffect, useState } from "react";
import { MapPin, Loader2, CheckCircle2, CircleAlert } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatShortDate } from "@/lib/format";

type Result = { serviceable: boolean; codAvailable: boolean; earliest: string; latest: string; zone: string } | { error: string };

export function PincodeChecker({ weightGrams = 500 }: { weightGrams?: number }) {
  const savedPin = useCart((s) => s.pincode);
  const setPincode = useCart((s) => s.setPincode);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const check = async (value: string) => {
    if (!/^[1-9]\d{5}$/.test(value)) {
      setResult({ error: "Enter a valid 6-digit pincode" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/pincode?pin=${value}&weight=${weightGrams / 1000}`);
      const data = await res.json();
      setResult(data);
      if (res.ok) setPincode(value);
    } catch {
      setResult({ error: "Could not check right now. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (savedPin && !pin) {
      setPin(savedPin);
      void check(savedPin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPin]);

  return (
    <div className="rounded-2xl border border-line p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <MapPin className="size-4" /> Check delivery
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void check(pin);
        }}
      >
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          placeholder="Enter pincode"
          aria-label="Delivery pincode"
          className="field h-10 flex-1"
        />
        <button className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-white" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Check"}
        </button>
      </form>
      {result &&
        ("error" in result ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <CircleAlert className="size-3.5" /> {result.error}
          </p>
        ) : result.serviceable ? (
          <div className="mt-3 space-y-1 text-sm">
            <p className="flex items-center gap-1.5 font-medium text-success">
              <CheckCircle2 className="size-4" /> Delivery by {formatShortDate(result.earliest)} – {formatShortDate(result.latest)}
            </p>
            <p className="text-xs text-muted">{result.codAvailable ? "Cash on delivery available" : "Prepaid orders only for this pincode"}</p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-danger">Sorry, we don&apos;t deliver to this pincode yet.</p>
        ))}
    </div>
  );
}
