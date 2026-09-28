/**
 * Delivery-time estimates. Used for "Estimated delivery" on product, cart and checkout pages.
 * When Shiprocket is configured the pincode checker refines this with live courier ETDs.
 */

type Zone = { name: string; minDays: number; maxDays: number };

const NCR_PREFIXES = ["110", "120", "121", "122", "124", "201", "203"];
const METRO_PREFIXES = ["400", "401", "411", "560", "600", "700", "500", "380", "302", "226", "160", "141"];

export function zoneForPincode(pincode?: string | null): Zone {
  if (!pincode || !/^\d{6}$/.test(pincode)) return { name: "India", minDays: 3, maxDays: 7 };
  const p3 = pincode.slice(0, 3);
  const p2 = pincode.slice(0, 2);
  if (NCR_PREFIXES.includes(p3)) return { name: "Delhi NCR", minDays: 1, maxDays: 3 };
  if (METRO_PREFIXES.includes(p3)) return { name: "Metro", minDays: 3, maxDays: 5 };
  if (["78", "79", "18", "19"].includes(p2) || p3 === "744" || p3 === "682") {
    return { name: "Remote", minDays: 6, maxDays: 10 };
  }
  return { name: "Rest of India", minDays: 4, maxDays: 7 };
}

function addBusinessDays(from: Date, days: number) {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added++; // couriers don't deliver on Sundays
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

export function estimateDelivery(pincode?: string | null, dispatchDays = 1, override?: { minDays: number; maxDays: number }): DeliveryEstimate {
  const zone = zoneForPincode(pincode);
  const minDays = (override?.minDays ?? zone.minDays) + dispatchDays;
  const maxDays = (override?.maxDays ?? zone.maxDays) + dispatchDays;
  const now = new Date();
  return {
    zone: zone.name,
    minDays,
    maxDays,
    earliest: addBusinessDays(now, minDays).toISOString(),
    latest: addBusinessDays(now, maxDays).toISOString(),
  };
}
