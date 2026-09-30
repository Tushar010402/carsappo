/**
 * Delivery-time estimates. Used for "Estimated delivery" on product, cart and checkout pages.
 * Zones and day ranges come from Admin → Shipping → Delivery zones (defaults in src/lib/content.ts).
 * When Shiprocket is configured the pincode checker refines this with live courier ETDs.
 */
import { DELIVERY_DEFAULTS } from "@/lib/content";

type Zone = { name: string; minDays: number; maxDays: number };
export type DeliveryConfig = typeof DELIVERY_DEFAULTS;

const prefixList = (prefixes: string) => prefixes.split(/[\s,]+/).filter((p) => /^\d{1,6}$/.test(p));

/** The zone whose pincode prefix matches most specifically; the "rest of India" range otherwise. */
export function zoneForPincode(pincode?: string | null, config: DeliveryConfig = DELIVERY_DEFAULTS): Zone {
  const rest = { name: config.restName, minDays: config.restMinDays, maxDays: config.restMaxDays };
  if (!pincode || !/^\d{6}$/.test(pincode)) return { ...rest, name: "India" };
  let best: { zone: Zone; length: number } | null = null;
  for (const z of config.zones) {
    for (const prefix of prefixList(z.prefixes)) {
      if (pincode.startsWith(prefix) && (!best || prefix.length > best.length)) best = { zone: z, length: prefix.length };
    }
  }
  return best ? { name: best.zone.name, minDays: best.zone.minDays, maxDays: best.zone.maxDays } : rest;
}

function addBusinessDays(from: Date, days: number, skipSundays: boolean) {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (!skipSundays || d.getDay() !== 0) added++; // most couriers don't deliver on Sundays
  }
  return d;
}

export type DeliveryEstimate = {
  zone: string;
  minDays: number;
  maxDays: number;
  earliest: string; // ISO
  latest: string; // ISO
};

export function estimateDelivery(
  pincode?: string | null,
  dispatchDays = 1,
  override?: { minDays: number; maxDays: number },
  config: DeliveryConfig = DELIVERY_DEFAULTS,
): DeliveryEstimate {
  const zone = zoneForPincode(pincode, config);
  const minDays = (override?.minDays ?? zone.minDays) + dispatchDays;
  const maxDays = (override?.maxDays ?? zone.maxDays) + dispatchDays;
  const now = new Date();
  return {
    zone: zone.name,
    minDays,
    maxDays,
    earliest: addBusinessDays(now, minDays, config.skipSundays).toISOString(),
    latest: addBusinessDays(now, maxDays, config.skipSundays).toISOString(),
  };
}
