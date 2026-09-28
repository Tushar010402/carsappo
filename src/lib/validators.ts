import { z } from "zod";
import { INDIAN_STATES } from "@/lib/constants";

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode");

export const gstinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Enter a valid GSTIN");

const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const addressSchema = z.object({
  name: z.string().trim().min(2, "Enter the full name").max(80),
  phone: phoneSchema,
  line1: z.string().trim().min(5, "Enter house / flat and street").max(200),
  line2: optionalText(200),
  landmark: optionalText(120),
  city: z.string().trim().min(2, "Enter the city").max(80),
  state: z.enum(INDIAN_STATES, { error: "Select a state" }),
  pincode: pincodeSchema,
});

export type AddressInput = z.infer<typeof addressSchema>;

export const cartItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(40),
      quantity: z.coerce.number().int().min(1).max(20),
    }),
  )
  .max(50);

export const checkoutSchema = z.object({
  items: cartItemsSchema.min(1, "Your cart is empty"),
  couponCode: z.string().trim().toUpperCase().max(40).optional().nullable(),
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
  addressId: z.string().max(40).optional().nullable(),
  saveAddress: z.boolean().optional(),
  gstin: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .pipe(gstinSchema.nullable()),
  note: z.string().trim().max(500).optional().nullable(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const passwordSchema = z.string().min(8, "Use at least 8 characters").max(100);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("").transform(() => undefined)),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(100),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("").transform(() => undefined)),
  subject: optionalText(150),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(3000),
});

export const reviewSchema = z.object({
  productId: z.string().min(1).max(40),
  name: z.string().trim().min(2, "Enter your name").max(60),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  title: optionalText(120),
  body: z.string().trim().min(10, "Write at least 10 characters").max(2000),
});

export const bookingSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal("").transform(() => undefined)),
  address: z.string().trim().min(8, "Enter your full address").max(300),
  society: optionalText(120),
  pincode: pincodeSchema,
  carModel: z.string().trim().min(2, "Enter your car model").max(80),
  carNumber: optionalText(20),
  serviceType: z.enum(["DAILY_EXTERIOR", "INTERIOR", "TYRE_POLISH", "DASHBOARD_POLISH"]),
  planId: optionalText(40),
  preferredDate: z.coerce.date({ error: "Choose a start date" }),
  preferredSlot: z.string().trim().min(1, "Choose a time slot").max(40),
  notes: optionalText(500),
});

/** First error message per field, keyed by dotted path (e.g. "address.pincode"). */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};
