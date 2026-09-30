import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateDelivery, zoneForPincode } from "../src/lib/delivery";
import { discountPercent, formatINR, rupeesToPaise } from "../src/lib/format";
import { addressSchema, phoneSchema, gstinSchema } from "../src/lib/validators";
import { safeRedirectPath, slugify, whatsappLink, youtubeId } from "../src/lib/utils";

test("delivery zones", () => {
  assert.equal(zoneForPincode("201310").name, "Delhi NCR");
  assert.equal(zoneForPincode("560034").name, "Metro cities");
  assert.equal(zoneForPincode("781001").name, "North-East, J&K & islands");
  assert.equal(zoneForPincode("452001").name, "Rest of India");
  const est = estimateDelivery("201310", 1);
  assert.ok(new Date(est.latest) >= new Date(est.earliest));
  assert.equal(est.minDays, 2);
});

test("money formatting", () => {
  assert.equal(formatINR(149900), "₹1,499");
  assert.equal(formatINR(3490), "₹34.90");
  assert.equal(rupeesToPaise("12.345"), 1235);
  assert.equal(discountPercent(349900, 599900), 42);
  assert.equal(discountPercent(1000, null), 0);
});

test("phone, GSTIN and address validation", () => {
  assert.equal(phoneSchema.parse("+91 98765-43210"), "9876543210");
  assert.equal(phoneSchema.safeParse("12345").success, false);
  assert.equal(gstinSchema.safeParse("09ABCDE1234F1Z5").success, true);
  assert.equal(gstinSchema.safeParse("09ABCDE1234F1X5").success, false);
  const ok = addressSchema.safeParse({ name: "Test", phone: "9876543210", line1: "Flat 1, Tower A", city: "Noida", state: "Uttar Pradesh", pincode: "201301" });
  assert.equal(ok.success, true);
  assert.equal(addressSchema.safeParse({ name: "T", phone: "1", line1: "x", city: "", state: "Nowhere", pincode: "0123" }).success, false);
});

test("utils", () => {
  assert.equal(slugify("7D Mats & Seat Covers!"), "7d-mats-and-seat-covers");
  assert.equal(safeRedirectPath("//evil.com"), "/");
  assert.equal(safeRedirectPath("https://evil.com"), "/");
  assert.equal(safeRedirectPath("/checkout"), "/checkout");
  assert.equal(safeRedirectPath("/\\evil.com"), "/");
  assert.equal(safeRedirectPath("/\t/evil.com"), "/");
  assert.equal(safeRedirectPath("/\n/evil.com"), "/");
  assert.equal(safeRedirectPath("javascript:alert(1)"), "/");
  assert.equal(safeRedirectPath("/account/orders?tab=open#x"), "/account/orders?tab=open#x");
  assert.equal(whatsappLink("98765 43210", "hi"), "https://wa.me/919876543210?text=hi");
  assert.equal(youtubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(youtubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
});
