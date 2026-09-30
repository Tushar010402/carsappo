import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, toCsv } from "../src/lib/admin/csv";
import { parseInventoryCsv, planInventoryImport, type CurrentProduct } from "../src/lib/admin/inventory-import";
import { DELIVERY_DEFAULTS, contentTokens, deliveryTable, fillTokens } from "../src/lib/content";
import { zoneForPincode } from "../src/lib/delivery";

test("CSV parser round-trips quoted cells, BOM and CRLF", () => {
  const csv = `﻿${toCsv(["SKU", "Product", "Note"], [["A-1", 'Mat "Pro", black', "line1\nline2"], ["=CMD", "x", ""]])}\r\n\r\n`;
  assert.deepEqual(parseCsv(csv), [
    ["SKU", "Product", "Note"],
    ["A-1", 'Mat "Pro", black', "line1\nline2"],
    ["'=CMD", "x", ""],
  ]);
});

const product = (over: Partial<CurrentProduct> = {}): CurrentProduct => ({
  id: "p1",
  sku: "CS-MAT-01",
  slug: "mat",
  name: "Mat",
  price: 149900,
  mrp: 199900,
  stock: 10,
  lowStockAlert: 5,
  gstRate: 18,
  ...over,
});

test("inventory import reads the export format and plans changes", () => {
  const csv = [
    "SKU,Product,Category,Brand,Stock,Low stock alert,Status,Price (INR),MRP (INR),GST %,HSN,Units sold,Stock value (INR)",
    "cs-mat-01,Mat,Mats,,25,5,In stock,\"1,299.00\",1999.00,18,,3,0",
    "CS-UNKNOWN,Ghost,Mats,,1,5,In stock,100,,18,,0,0",
    "CS-SAME,Same,Mats,,4,2,In stock,500,,12,,0,0",
  ].join("\n");
  const parsed = parseInventoryCsv(csv);
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.columns, ["price", "mrp", "stock", "lowStockAlert", "gstRate"]);
  assert.deepEqual(parsed.rows[0], { line: 2, sku: "CS-MAT-01", price: 129900, mrp: 199900, stock: 25, lowStockAlert: 5, gstRate: 18 });

  const plan = planInventoryImport(parsed.rows, [product(), product({ id: "p2", sku: "CS-SAME", price: 50000, mrp: null, stock: 4, lowStockAlert: 2, gstRate: 12 })]);
  assert.deepEqual(plan.unknown, ["CS-UNKNOWN"]);
  assert.equal(plan.unchanged, 1);
  assert.equal(plan.changes.length, 1);
  assert.deepEqual(plan.changes[0].data, { price: 129900, stock: 25 });
  assert.match(plan.changes[0].summary, /price ₹1,499 → ₹1,299, stock 10 → 25/);
});

test("inventory import validates rows and blank cells keep values", () => {
  const parsed = parseInventoryCsv("SKU,Price,MRP,Stock,GST %\nA,abc,,1.5,7\nB,,0,,\nB,10,,,\n,5,,,");
  assert.equal(parsed.rows.length, 1);
  assert.deepEqual(parsed.rows[0], { line: 3, sku: "B", mrp: null });
  assert.equal(parsed.errors.length, 2);
  assert.match(parsed.errors[0], /Row 2 \(A\): Price “abc” is not a number; Stock must be a whole number.*; GST % must be one of/);
  assert.match(parsed.errors[1], /Row 4 \(B\): SKU repeats row 3/);

  const plan = planInventoryImport(parseInventoryCsv("SKU,Price\nCS-MAT-01,2500").rows, [product()]);
  assert.match(plan.errors[0], /MRP ₹1,999 is below the selling price ₹2,500/);

  assert.match(parseInventoryCsv("Name,Price\nx,1").errors[0], /SKU column/);
  assert.match(parseInventoryCsv("SKU,Name\nx,1").errors[0], /at least one column/);
});

test("content tokens and delivery table follow settings", () => {
  const tokens = contentTokens({
    store: { name: "Carsappo", legalName: "", email: "a@b.in", phone: "+91 90000 00000", address: "", gstin: "" },
    shipping: { freeShippingThreshold: 0, flatShippingFee: 4900, codEnabled: false, codFee: 0, codMaxOrder: 0, dispatchDays: 2, returnWindowDays: 10 },
  });
  assert.equal(fillTokens("Returns within {returnDays} days at {storeName}. {codShort}{unknown}", tokens), "Returns within 10 days at Carsappo. {unknown}");
  const delivery = { ...DELIVERY_DEFAULTS, zones: [{ name: "Noida", prefixes: "2013", minDays: 1, maxDays: 1 }], restName: "Elsewhere" };
  assert.match(deliveryTable(delivery), /\| Noida \| 1 day \|\n\| Elsewhere \| 4–7 days \|/);
  assert.equal(zoneForPincode("201310", delivery).name, "Noida");
  assert.equal(zoneForPincode("110001", delivery).name, "Elsewhere");
});
