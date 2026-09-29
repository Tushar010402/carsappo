import "server-only";
import type { Order, OrderItem } from "@prisma/client";

// Overridable only so automated tests can point at a local stand-in.
const API = process.env.SHIPROCKET_API_BASE || "https://apiv2.shiprocket.in/v1/external";

export function shiprocketEnabled() {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; message?: string };
  if (!res.ok || !data.token) throw new Error(data.message || "Shiprocket login failed");
  // Tokens are valid for 10 days; refresh after 9.
  cachedToken = { token: data.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 };
  return data.token;
}

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (res.status === 401) cachedToken = null;
  if (!res.ok) throw new Error(data?.message || `Shiprocket error ${res.status}`);
  return data;
}

const rupees = (paise: number) => Math.round(paise) / 100;

function istTimestamp(d: Date) {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 16).replace("T", " ");
}

export type PackageDims = { weightGrams: number; lengthCm: number; breadthCm: number; heightCm: number };

export async function createShiprocketOrder(
  order: Order & { items: OrderItem[] },
  pickupLocation: string,
  dims: PackageDims,
) {
  const [firstName, ...rest] = order.shipName.split(" ");
  return call<{ order_id: number; shipment_id: number; status: string; awb_code?: string; courier_name?: string }>(
    "/orders/create/adhoc",
    {
      method: "POST",
      body: {
        order_id: order.orderNumber,
        order_date: istTimestamp(order.createdAt),
        pickup_location: pickupLocation,
        billing_customer_name: firstName,
        billing_last_name: rest.join(" ") || ".",
        billing_address: order.shipLine1,
        billing_address_2: [order.shipLine2, order.shipLandmark].filter(Boolean).join(", "),
        billing_city: order.shipCity,
        billing_pincode: order.shipPincode,
        billing_state: order.shipState,
        billing_country: "India",
        billing_email: order.email,
        billing_phone: order.shipPhone,
        shipping_is_billing: true,
        order_items: order.items.map((i) => ({
          name: i.name,
          sku: i.sku,
          units: i.quantity,
          selling_price: rupees(i.price),
          hsn: i.hsnCode ?? "",
          tax: i.gstRate,
        })),
        payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
        shipping_charges: rupees(order.shippingFee),
        total_discount: rupees(order.discount),
        sub_total: rupees(order.total),
        length: dims.lengthCm,
        breadth: dims.breadthCm,
        height: dims.heightCm,
        weight: Math.max(dims.weightGrams / 1000, 0.1),
      },
    },
  );
}

export async function assignAwb(shipmentId: string, courierId?: number) {
  const data = await call<{
    awb_assign_status: number;
    response?: { data?: { awb_code?: string; courier_name?: string } };
    message?: string;
  }>("/courier/assign/awb", { method: "POST", body: { shipment_id: shipmentId, ...(courierId ? { courier_id: courierId } : {}) } });
  if (data.awb_assign_status !== 1 || !data.response?.data?.awb_code) {
    throw new Error(data.message || "Could not assign AWB — check wallet balance and courier serviceability in Shiprocket");
  }
  return { awbCode: data.response.data.awb_code, courierName: data.response.data.courier_name ?? null };
}

export function requestPickup(shipmentId: string) {
  return call<{ pickup_status: number }>("/courier/generate/pickup", { method: "POST", body: { shipment_id: [shipmentId] } });
}

export async function generateLabel(shipmentId: string) {
  const data = await call<{ label_created: number; label_url?: string; response?: string }>("/courier/generate/label", {
    method: "POST",
    body: { shipment_id: [shipmentId] },
  });
  if (!data.label_url) throw new Error(data.response || "Label could not be generated yet");
  return data.label_url;
}

export function cancelShiprocketOrder(shiprocketOrderId: string) {
  return call("/orders/cancel", { method: "POST", body: { ids: [Number(shiprocketOrderId)] } });
}

export type TrackingActivity = { date: string; status: string; activity: string; location: string };

export async function trackAwb(awb: string) {
  const data = await call<{
    tracking_data?: {
      track_status?: number;
      shipment_status?: number;
      shipment_track?: { current_status?: string; edd?: string | null; delivered_date?: string | null }[];
      shipment_track_activities?: { date: string; status?: string; "sr-status-label"?: string; activity: string; location: string }[];
      track_url?: string;
      etd?: string;
    };
  }>(`/courier/track/awb/${encodeURIComponent(awb)}`);
  const t = data.tracking_data;
  return {
    currentStatus: t?.shipment_track?.[0]?.current_status ?? null,
    etd: t?.etd ?? t?.shipment_track?.[0]?.edd ?? null,
    trackUrl: t?.track_url ?? null,
    activities: (t?.shipment_track_activities ?? []).map<TrackingActivity>((a) => ({
      date: a.date,
      status: a["sr-status-label"] ?? a.status ?? "",
      activity: a.activity,
      location: a.location,
    })),
  };
}

export async function checkServiceability(args: { pickupPincode: string; deliveryPincode: string; weightKg: number; cod: boolean }) {
  const qs = new URLSearchParams({
    pickup_postcode: args.pickupPincode,
    delivery_postcode: args.deliveryPincode,
    weight: String(args.weightKg),
    cod: args.cod ? "1" : "0",
  });
  const data = await call<{
    status?: number;
    data?: { available_courier_companies?: { courier_name: string; estimated_delivery_days?: string; etd?: string; cod: number }[] };
  }>(`/courier/serviceability/?${qs}`);
  const couriers = data.data?.available_courier_companies ?? [];
  const days = couriers.map((c) => Number(c.estimated_delivery_days)).filter((n) => Number.isFinite(n) && n > 0);
  return {
    serviceable: couriers.length > 0,
    codAvailable: couriers.some((c) => c.cod === 1),
    minDays: days.length ? Math.min(...days) : null,
    maxDays: days.length ? Math.max(...days) : null,
  };
}

/** Maps Shiprocket shipment status text to our order status. */
export function mapShiprocketStatus(status: string | null | undefined) {
  const s = (status ?? "").toUpperCase();
  if (s.includes("RTO") || s.includes("RETURN")) return "RETURNED" as const;
  if (s.includes("CANCEL")) return "CANCELLED" as const;
  if (s === "DELIVERED") return "DELIVERED" as const;
  if (s.includes("OUT FOR DELIVERY")) return "OUT_FOR_DELIVERY" as const;
  if (s.includes("TRANSIT") || s.includes("PICKED UP") || s.includes("SHIPPED") || s.includes("REACHED")) return "SHIPPED" as const;
  return null;
}
