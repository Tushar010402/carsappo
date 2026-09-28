import { test } from "node:test";
import assert from "node:assert/strict";
import { allocateDiscount, amountInWords, buildInvoice, financialYear, gstIncluded, isIntraState } from "../src/lib/gst";

test("gstIncluded extracts tax from inclusive prices", () => {
  assert.equal(gstIncluded(11800, 18), 1800);
  assert.equal(gstIncluded(11200, 12), 1200);
  assert.equal(gstIncluded(10000, 0), 0);
});

test("allocateDiscount splits exactly and pro-rata", () => {
  const shares = allocateDiscount([34900, 10000, 5000], 3490);
  assert.equal(shares.reduce((a, b) => a + b, 0), 3490);
  assert.ok(shares[0] > shares[1] && shares[1] > shares[2]);
  assert.deepEqual(allocateDiscount([100, 200], 0), [0, 0]);
});

test("intra-state invoice splits CGST/SGST and totals reconcile", () => {
  const inv = buildInvoice({
    items: [{ name: "Tyre Polish", sku: "T", hsnCode: "34053000", price: 34900, quantity: 1, gstRate: 18 }],
    discount: 3490,
    shippingFee: 7900,
    codFee: 4900,
    sellerState: "Uttar Pradesh",
    buyerState: "uttar pradesh",
  });
  assert.equal(inv.intraState, true);
  assert.equal(inv.igst, 0);
  assert.equal(inv.grandTotal, 34900 - 3490 + 7900 + 4900);
  assert.equal(inv.taxable + inv.totalTax, inv.grandTotal);
  assert.equal(inv.cgst + inv.sgst, inv.totalTax);
  assert.equal(inv.lines.length, 3);
});

test("inter-state invoice uses IGST only", () => {
  const inv = buildInvoice({
    items: [
      { name: "Mats", sku: "M", hsnCode: "57050049", price: 349900, quantity: 1, gstRate: 12 },
      { name: "Cloth", sku: "C", hsnCode: "63071090", price: 49900, quantity: 2, gstRate: 12 },
    ],
    discount: 0,
    shippingFee: 0,
    codFee: 0,
    sellerState: "Uttar Pradesh",
    buyerState: "Karnataka",
  });
  assert.equal(inv.intraState, false);
  assert.equal(inv.cgst + inv.sgst, 0);
  assert.equal(inv.igst, inv.totalTax);
  assert.equal(inv.grandTotal, 349900 + 99800);
  assert.deepEqual(inv.byRate.map((r) => r.rate), [12]);
});

test("isIntraState normalises names", () => {
  assert.ok(isIntraState("Uttar Pradesh", " UTTAR-PRADESH "));
  assert.ok(!isIntraState("Delhi", "Haryana"));
});

test("amountInWords uses the Indian numbering system", () => {
  assert.equal(amountInWords(44210), "Rupees Four Hundred Forty Two and Ten Paise Only");
  assert.equal(amountInWords(12345600), "Rupees One Lakh Twenty Three Thousand Four Hundred Fifty Six Only");
  assert.equal(amountInWords(0), "Rupees Zero Only");
});

test("financialYear rolls over on 1 April IST", () => {
  assert.equal(financialYear(new Date("2026-03-31T12:00:00Z")), "25-26");
  assert.equal(financialYear(new Date("2026-04-01T00:00:00+05:30")), "26-27");
});
