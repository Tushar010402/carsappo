import type { NextRequest } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { csvMoney, csvResponse } from "@/lib/admin/csv";
import { inventoryWhere } from "@/lib/admin/inventory";
import { istToday } from "@/lib/admin/query";

export async function GET(req: NextRequest) {
  try {
    await assertAdmin();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const { where } = await inventoryWhere(sp);
  const products = await prisma.product.findMany({
    where,
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    select: {
      sku: true,
      name: true,
      stock: true,
      lowStockAlert: true,
      price: true,
      mrp: true,
      gstRate: true,
      hsnCode: true,
      isActive: true,
      salesCount: true,
      category: { select: { name: true } },
      brand: { select: { name: true } },
    },
  });
  return csvResponse(
    `carsappo-inventory-${istToday()}.csv`,
    ["SKU", "Product", "Category", "Brand", "Stock", "Low stock alert", "Status", "Price (INR)", "MRP (INR)", "GST %", "HSN", "Units sold", "Stock value (INR)"],
    products.map((p) => [
      p.sku,
      p.name,
      p.category.name,
      p.brand?.name ?? "",
      p.stock,
      p.lowStockAlert,
      !p.isActive ? "Hidden" : p.stock <= 0 ? "Out of stock" : p.stock <= p.lowStockAlert ? "Low stock" : "In stock",
      csvMoney(p.price),
      p.mrp ? csvMoney(p.mrp) : "",
      p.gstRate,
      p.hsnCode ?? "",
      p.salesCount,
      csvMoney(Math.max(p.stock, 0) * p.price),
    ]),
  );
}
