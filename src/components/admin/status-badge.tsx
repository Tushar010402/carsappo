import type { BookingStatus, OrderStatus, PaymentMethod, PaymentStatus, ReturnStatus } from "@prisma/client";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { BOOKING_STATUS_LABEL, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, RETURN_STATUS_LABEL } from "@/lib/constants";

const ORDER_TONE: Record<OrderStatus, BadgeTone> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "brand",
  SHIPPED: "dark",
  OUT_FOR_DELIVERY: "dark",
  DELIVERED: "success",
  CANCELLED: "danger",
  RETURNED: "danger",
};

const PAYMENT_TONE: Record<PaymentStatus, BadgeTone> = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "danger",
  REFUNDED: "soft",
};

const BOOKING_TONE: Record<BookingStatus, BadgeTone> = {
  NEW: "brand",
  CONFIRMED: "info",
  ACTIVE: "success",
  COMPLETED: "soft",
  CANCELLED: "danger",
};

const RETURN_TONE: Record<ReturnStatus, BadgeTone> = {
  REQUESTED: "brand",
  APPROVED: "info",
  REJECTED: "danger",
  PICKED_UP: "dark",
  REFUNDED: "success",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

export function PaymentBadge({ status, method }: { status: PaymentStatus; method?: PaymentMethod }) {
  const label = method === "COD" && status === "PENDING" ? "COD · unpaid" : PAYMENT_STATUS_LABEL[status];
  return <Badge tone={method === "COD" && status === "PENDING" ? "soft" : PAYMENT_TONE[status]}>{label}</Badge>;
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={BOOKING_TONE[status]}>{BOOKING_STATUS_LABEL[status]}</Badge>;
}

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  return <Badge tone={RETURN_TONE[status]}>{RETURN_STATUS_LABEL[status]}</Badge>;
}

export function ActiveBadge({ active, on = "Active", off = "Hidden" }: { active: boolean; on?: string; off?: string }) {
  return <Badge tone={active ? "success" : "soft"}>{active ? on : off}</Badge>;
}

export function StockBadge({ stock, alert }: { stock: number; alert: number }) {
  if (stock <= 0) return <Badge tone="danger">Out of stock</Badge>;
  if (stock <= alert) return <Badge tone="warning">Low · {stock}</Badge>;
  return <Badge tone="success">{stock} in stock</Badge>;
}
