import type { BookingStatus, OrderStatus, PaymentStatus, ReturnStatus, ServiceType } from "@prisma/client";

export const SITE_NAME = "Carsappo";
export const TAGLINE = "Everything Your Car Needs.";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const FUEL_TYPES = [
  { value: "PETROL", label: "Petrol" },
  { value: "DIESEL", label: "Diesel" },
  { value: "CNG", label: "CNG" },
  { value: "EV", label: "Electric" },
  { value: "HYBRID", label: "Hybrid" },
] as const;

export function fuelLabel(value: string) {
  return FUEL_TYPES.find((f) => f.value === value)?.label ?? value;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Awaiting payment",
  CONFIRMED: "Confirmed",
  PROCESSING: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

/** Customer-facing tracking steps, in order. */
export const ORDER_PROGRESS: OrderStatus[] = ["CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PICKED_UP: "Picked up",
  REFUNDED: "Refunded",
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  NEW: "New",
  CONFIRMED: "Confirmed",
  ACTIVE: "Active subscription",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const SERVICE_TYPES: { value: ServiceType; label: string; short: string; description: string; icon: string }[] = [
  {
    value: "DAILY_EXTERIOR",
    label: "Daily Exterior Cleaning",
    short: "Daily Exterior",
    description: "Waterless exterior wipe-down every morning at your parking spot, before you leave for work.",
    icon: "Sparkles",
  },
  {
    value: "INTERIOR",
    label: "Interior Cleaning",
    short: "Interior",
    description: "Vacuuming, mat cleaning, dashboard and door-pad wipe with premium, safe products.",
    icon: "Armchair",
  },
  {
    value: "TYRE_POLISH",
    label: "Tyre Polish",
    short: "Tyre Polish",
    description: "Deep-black, long-lasting tyre dressing that protects rubber from cracking and fading.",
    icon: "CircleDot",
  },
  {
    value: "DASHBOARD_POLISH",
    label: "Dashboard Polish",
    short: "Dashboard Polish",
    description: "Anti-static, UV-protective dashboard polish for a clean matte or glossy finish.",
    icon: "Gauge",
  },
];

export function serviceLabel(value: ServiceType) {
  return SERVICE_TYPES.find((s) => s.value === value)?.label ?? value;
}

export const SERVICE_SLOTS = ["6:00 AM – 8:00 AM", "8:00 AM – 10:00 AM", "10:00 AM – 12:00 PM", "4:00 PM – 6:00 PM"];

export const RETURN_REASONS = [
  "Received a damaged product",
  "Wrong item delivered",
  "Does not fit my vehicle",
  "Product not as described",
  "Quality not as expected",
  "Other",
];

export const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" },
  { value: "discount", label: "Biggest discount" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 24;

/** Popular search terms shown under the smart search (from the brief). */
export const POPULAR_SEARCHES = ["Mats", "Seat Covers", "Tyre Polish", "Dashboard Polish", "Microfiber", "Vacuum Cleaner", "Perfume"];

/** GST slabs a product can carry (percent). */
export const GST_RATES = [0, 5, 12, 18, 28] as const;
