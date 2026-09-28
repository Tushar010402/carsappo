"use client";

import { useEffect, useState } from "react";
import { MapPin, Loader2, CheckCircle2, CircleAlert } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatShortDate } from "@/lib/format";

type Result = { serviceable: boolean; codAvailable: boolean; earliest: string; latest: string; zone: string } | { error: string };

const VALID = /^[1-9]\d{5}$/;

export function PincodeChecker({ weightGrams = 500 }: { weightGrams?: number }) {
  const savedPin = useCart((s) => s.pincode);
  const setPincode = useCart((s) => s.setPincode);
  // null = untouched: fall back to the pincode remembered from an earlier check.
  const [input, setInput] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ pin: string; data: Result } | null>(null);

  const pin = input ?? savedPin ?? "";
  const requested = submitted ?? (savedPin && VALID.test(savedPin) ? savedPin : null);
  const loading = !!requested && result?.pin !== requested;
  const shown = result && result.pin === requested ? result.data : null;

  useEffect(() => {
    if (!requested) return;
    let cancelled = false;
    fetch(`/api/pincode?pin=${requested}&weight=${weightGrams / 1000}`)
      .then(async (res) => {
        const data = (await res.json()) as Result;
        if (cancelled) return;
        setResult({ pin: requested, data });
        if (res.ok) setPincode(requested);
      })
      .catch(() => !cancelled && setResult({ pin: requested, data: { error: "Could not check right now. Please try again." } }));
    return () => {
      cancelled = true;
    };
  }, [requested, weightGrams, setPincode]);

  return (
    <div className="rounded-2xl border border-line p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <MapPin className="size-4" /> Check delivery
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!VALID.test(pin)) {
            setError("Enter a valid 6-digit pincode");
            return;
          }
          setError(null);
          setSubmitted(pin);
        }}
      >
        <input
          value={pin}
          onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          placeholder="Enter pincode"
          aria-label="Delivery pincode"
          className="field h-10 flex-1"
        />
        <button className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-white" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Check"}
        </button>
      </form>
      {error ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
          <CircleAlert className="size-3.5" /> {error}
        </p>
      ) : shown ? (
        "error" in shown ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <CircleAlert className="size-3.5" /> {shown.error}
          </p>
        ) : shown.serviceable ? (
          <div className="mt-3 space-y-1 text-sm">
            <p className="flex items-center gap-1.5 font-medium text-success">
              <CheckCircle2 className="size-4" /> Delivery by {formatShortDate(shown.earliest)} – {formatShortDate(shown.latest)}
            </p>
            <p className="text-xs text-muted">{shown.codAvailable ? "Cash on delivery available" : "Prepaid orders only for this pincode"}</p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-danger">Sorry, we don&apos;t deliver to this pincode yet.</p>
        )
      ) : null}
    </div>
  );
}
