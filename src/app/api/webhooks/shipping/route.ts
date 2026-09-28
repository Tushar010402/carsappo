import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { setOrderStatus } from "@/lib/orders";
import { mapShiprocketStatus } from "@/lib/shiprocket";

/**
 * Shiprocket tracking webhook (Shiprocket → Settings → API → Webhooks).
 * Note: Shiprocket rejects webhook URLs containing "shiprocket", hence /api/webhooks/shipping.
 * Configure the same secret as SHIPROCKET_WEBHOOK_TOKEN; Shiprocket sends it in the x-api-key header.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  const given = req.headers.get("x-api-key") ?? "";
  if (!expected || given.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    awb?: string | number;
    order_id?: string;
    current_status?: string;
    shipment_status?: string;
    courier_name?: string;
    etd?: string;
  } | null;
  if (!body) return NextResponse.json({ ok: true });

  const awb = body.awb ? String(body.awb) : null;
  const order = await prisma.order.findFirst({
    where: { OR: [...(awb ? [{ awbCode: awb }] : []), ...(body.order_id ? [{ orderNumber: String(body.order_id) }] : [])] },
  });
  if (!order) return NextResponse.json({ ok: true });

  const statusText = body.current_status ?? body.shipment_status ?? "";
  const next = mapShiprocketStatus(statusText);
  const etd = body.etd ? new Date(body.etd) : null;
  await prisma.order.update({
    where: { id: order.id },
    data: {
      ...(awb && !order.awbCode ? { awbCode: awb } : {}),
      ...(body.courier_name && !order.courierName ? { courierName: body.courier_name } : {}),
      ...(etd && !Number.isNaN(etd.getTime()) ? { estimatedDelivery: etd } : {}),
    },
  });

  const terminal = ["DELIVERED", "CANCELLED", "RETURNED"];
  if (next && next !== order.status && !terminal.includes(order.status)) {
    await setOrderStatus(order.id, next, `Courier update: ${statusText}`);
  }
  // Always 200 so Shiprocket doesn't retry indefinitely.
  return NextResponse.json({ ok: true });
}
