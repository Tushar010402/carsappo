import { NextResponse, type NextRequest } from "next/server";
import { estimateDelivery } from "@/lib/delivery";
import { getSettings } from "@/lib/settings";
import { checkServiceability, shiprocketEnabled } from "@/lib/shiprocket";

export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get("pin") ?? "";
  if (!/^[1-9]\d{5}$/.test(pin)) return NextResponse.json({ error: "Enter a valid 6-digit pincode" }, { status: 400 });
  const weightKg = Math.min(Math.max(Number(req.nextUrl.searchParams.get("weight")) || 0.5, 0.1), 30);
  const settings = await getSettings();
  const { shipping, store } = settings;

  let serviceable = true;
  let codAvailable = shipping.codEnabled;
  let override: { minDays: number; maxDays: number } | undefined;

  if (shiprocketEnabled()) {
    try {
      const res = await checkServiceability({ pickupPincode: store.pincode, deliveryPincode: pin, weightKg, cod: true });
      serviceable = res.serviceable;
      codAvailable = codAvailable && res.codAvailable;
      if (res.minDays && res.maxDays) override = { minDays: res.minDays, maxDays: res.maxDays };
    } catch {
      // fall back to heuristic estimate
    }
  }

  const estimate = estimateDelivery(pin, shipping.dispatchDays, override);
  return NextResponse.json(
    { pincode: pin, serviceable, codAvailable, ...estimate, freeShippingThreshold: shipping.freeShippingThreshold },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
