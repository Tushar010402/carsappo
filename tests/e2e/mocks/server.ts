/**
 * Local stand-in for the Razorpay and Shiprocket REST APIs used during end-to-end tests.
 * Responses follow the shapes documented by both providers. Every call is recorded and
 * can be inspected at GET /__calls (and cleared with DELETE /__calls).
 */
import http from "node:http";
import crypto from "node:crypto";
import { MOCK_PORT } from "../env";

type Call = { method: string; path: string; body: unknown; at: number };
const calls: Call[] = [];
const rzpOrders = new Map<string, { id: string; amount: number; currency: string; status: string; receipt: string }>();

function send(res: http.ServerResponse, status: number, data: unknown, type = "application/json") {
  res.writeHead(status, { "Content-Type": type });
  res.end(type === "application/json" ? JSON.stringify(data) : (data as string));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${MOCK_PORT}`);
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }
  const path = url.pathname;
  if (path === "/__calls") {
    if (req.method === "DELETE") calls.length = 0;
    return send(res, 200, calls);
  }
  if (path === "/health") return send(res, 200, { ok: true });
  calls.push({ method: req.method ?? "GET", path: `${path}${url.search}`, body, at: Date.now() });

  // ── Razorpay ──────────────────────────────────────────────
  if (path.startsWith("/razorpay/v1")) {
    const auth = req.headers.authorization ?? "";
    if (!auth.startsWith("Basic ")) return send(res, 401, { error: { code: "BAD_REQUEST_ERROR", description: "Authentication failed" } });
    const sub = path.replace("/razorpay/v1", "");
    if (req.method === "POST" && sub === "/orders") {
      const b = body as { amount: number; currency: string; receipt: string };
      if (!Number.isInteger(b.amount) || b.amount < 100) {
        return send(res, 400, { error: { code: "BAD_REQUEST_ERROR", description: "The amount must be atleast INR 1.00" } });
      }
      const order = { id: `order_${crypto.randomBytes(7).toString("hex")}`, amount: b.amount, currency: b.currency, status: "created", receipt: b.receipt };
      rzpOrders.set(order.id, order);
      return send(res, 200, { ...order, entity: "order", amount_paid: 0, amount_due: b.amount, attempts: 0 });
    }
    const orderMatch = sub.match(/^\/orders\/([\w-]+)$/);
    if (req.method === "GET" && orderMatch) {
      const order = rzpOrders.get(orderMatch[1]);
      if (!order) return send(res, 400, { error: { code: "BAD_REQUEST_ERROR", description: "The id provided does not exist" } });
      return send(res, 200, { ...order, entity: "order", amount_paid: order.status === "paid" ? order.amount : 0 });
    }
    const refundMatch = sub.match(/^\/payments\/([\w-]+)\/refund$/);
    if (req.method === "POST" && refundMatch) {
      const b = (body ?? {}) as { amount?: number };
      return send(res, 200, { id: `rfnd_${crypto.randomBytes(6).toString("hex")}`, entity: "refund", payment_id: refundMatch[1], amount: b.amount ?? null, status: "processed" });
    }
    return send(res, 404, { error: { description: "Not found" } });
  }

  // ── Shiprocket ────────────────────────────────────────────
  if (path.startsWith("/shiprocket")) {
    const sub = path.replace("/shiprocket", "");
    if (sub === "/auth/login") return send(res, 200, { token: "mock-shiprocket-token", email: "api@carsappo.test" });
    if ((req.headers.authorization ?? "") !== "Bearer mock-shiprocket-token") return send(res, 401, { message: "Unauthenticated." });
    if (sub === "/orders/create/adhoc") {
      return send(res, 200, { order_id: 900000 + calls.length, shipment_id: 800000 + calls.length, status: "NEW", status_code: 1 });
    }
    if (sub === "/courier/assign/awb") {
      return send(res, 200, { awb_assign_status: 1, response: { data: { awb_code: "E2EAWB1234567", courier_name: "Delhivery Surface", shipment_id: (body as { shipment_id: string }).shipment_id } } });
    }
    if (sub === "/courier/generate/pickup") return send(res, 200, { pickup_status: 1, response: { pickup_scheduled_date: new Date().toISOString() } });
    if (sub === "/courier/generate/label") return send(res, 200, { label_created: 1, label_url: `http://localhost:${MOCK_PORT}/label.pdf` });
    if (sub.startsWith("/courier/track/awb/")) {
      return send(res, 200, {
        tracking_data: {
          track_status: 1,
          shipment_status: 7,
          shipment_track: [{ current_status: "Out For Delivery", edd: null }],
          shipment_track_activities: [
            { date: "2026-09-29 09:10:00", status: "OFD", "sr-status-label": "OUT FOR DELIVERY", activity: "Out for delivery", location: "Greater Noida Hub" },
            { date: "2026-09-28 18:40:00", status: "IT", "sr-status-label": "IN TRANSIT", activity: "Reached destination hub", location: "Greater Noida Hub" },
          ],
          track_url: "https://shiprocket.co/tracking/E2EAWB1234567",
          etd: "2026-09-30 18:00:00",
        },
      });
    }
    if (sub.startsWith("/courier/serviceability")) {
      const pin = url.searchParams.get("delivery_postcode");
      if (pin === "999999") return send(res, 200, { status: 404, data: { available_courier_companies: [] } });
      return send(res, 200, {
        status: 200,
        data: {
          available_courier_companies: [
            { courier_name: "Delhivery Surface", estimated_delivery_days: "3", etd: "Oct 02, 2026", cod: 1 },
            { courier_name: "Xpressbees", estimated_delivery_days: "4", etd: "Oct 03, 2026", cod: 1 },
          ],
        },
      });
    }
    if (sub === "/orders/cancel") return send(res, 200, { message: "Order cancelled" });
    return send(res, 404, { message: "Not found" });
  }

  if (path === "/label.pdf") return send(res, 200, "%PDF-1.4\n% mock label\n", "application/pdf");
  send(res, 404, { error: "unknown mock route" });
});

server.listen(MOCK_PORT, () => console.log(`[mocks] Razorpay/Shiprocket stand-ins on :${MOCK_PORT}`));
