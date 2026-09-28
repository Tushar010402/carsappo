/**
 * Seeds Carsappo with the starter catalogue and content.
 *   npm run db:seed                 → categories, brands, products, vehicles, services, FAQs, blog, admin user
 *   SEED_DEMO=true npm run db:seed  → also sample reviews, testimonials and orders (for demos only — never on the live site)
 * Safe to re-run: records are upserted by slug.
 */
import crypto from "node:crypto";
import { PrismaClient, type OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  blogCategories,
  brands,
  categories,
  faqs,
  popularModels,
  posts,
  products,
  sampleReviews,
  servicePlans,
  testimonials,
  vehicles,
} from "./seed-data";

const prisma = new PrismaClient();
const DEMO = process.env.SEED_DEMO === "true";
const paise = (rupees: number) => Math.round(rupees * 100);
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@carsappo.com").toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "ADMIN") await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
    console.log(`✓ Admin exists: ${email}`);
    return;
  }
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");
  await prisma.user.create({
    data: { name: "Carsappo Admin", email, role: "ADMIN", passwordHash: await bcrypt.hash(password, 11) },
  });
  console.log(`✓ Admin created: ${email}${process.env.ADMIN_PASSWORD ? "" : `  password: ${password}  (change it after first login)`}`);
}

async function seedCatalog() {
  const categoryIds = new Map<string, string>();
  for (const [i, c] of categories.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        description: c.description,
        image: `/images/placeholders/categories/${c.slug}.svg`,
        sortOrder: i,
        metaTitle: `${c.name} — Buy Online in India`,
        metaDescription: `${c.description} Genuine products, fast delivery across India.`,
      },
      update: { icon: c.icon, sortOrder: i },
    });
    categoryIds.set(c.slug, row.id);
  }

  const brandIds = new Map<string, string>();
  for (const b of brands) {
    const row = await prisma.brand.upsert({ where: { slug: slug(b) }, create: { name: b, slug: slug(b) }, update: {} });
    brandIds.set(b, row.id);
  }

  // Vehicles
  const carModelIds: string[] = [];
  const bikeModelIds: string[] = [];
  const popularIds: string[] = [];
  for (const [i, make] of vehicles.entries()) {
    const m = await prisma.vehicleMake.upsert({
      where: { slug: slug(make.name) },
      create: { name: make.name, slug: slug(make.name), sortOrder: i },
      update: { sortOrder: i },
    });
    for (const model of make.models) {
      const row = await prisma.vehicleModel.upsert({
        where: { makeId_slug: { makeId: m.id, slug: slug(model.name) } },
        create: {
          makeId: m.id,
          name: model.name,
          slug: slug(model.name),
          yearFrom: model.from,
          yearTo: model.to ?? null,
          fuelTypes: model.fuels,
          type: model.type ?? "CAR",
        },
        update: { yearFrom: model.from, yearTo: model.to ?? null, fuelTypes: model.fuels, type: model.type ?? "CAR" },
      });
      if (model.type === "BIKE") bikeModelIds.push(row.id);
      else carModelIds.push(row.id);
      if (popularModels.includes(model.name)) popularIds.push(row.id);
    }
  }
  console.log(`✓ ${vehicles.length} vehicle brands, ${carModelIds.length} car models, ${bikeModelIds.length} bike models`);

  const createdAt = Date.now();
  for (const [i, p] of products.entries()) {
    const discountPercent = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
    const data = {
      name: p.name,
      sku: p.sku,
      shortDescription: p.short,
      description: `${p.short}\n\n### Why you'll love it\n\n${p.features.map((f) => `- ${f}`).join("\n")}\n\n### In the box\n\n- 1 × ${p.name}\n- Carsappo quality-check card`,
      price: paise(p.price),
      mrp: paise(p.mrp),
      discountPercent,
      gstRate: p.gstRate,
      hsnCode: p.hsn,
      stock: p.stock,
      weightGrams: p.weight ?? 500,
      features: p.features,
      tags: p.tags,
      categoryId: categoryIds.get(p.category)!,
      brandId: brandIds.get(p.brand) ?? null,
      isUniversal: p.fit === "universal",
      isFeatured: !!p.flags?.featured,
      isBestSeller: !!p.flags?.bestSeller,
      isTrending: !!p.flags?.trending,
      isPremium: !!p.flags?.premium,
      salesCount: p.sales ?? 0,
      videoUrl: p.video ?? null,
      metaTitle: `${p.name} — Buy Online`,
      metaDescription: `${p.short} ${discountPercent ? `Save ${discountPercent}%.` : ""} Free shipping over ₹999. Fast delivery across India.`.trim(),
    };
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...data, createdAt: new Date(createdAt - i * 36e5 * 20) },
      update: data,
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: [1, 2, 3].map((n) => ({
        productId: product.id,
        url: `/images/placeholders/products/${p.slug}-${n}.svg`,
        alt: `${p.name} — image ${n}`,
        sortOrder: n,
      })),
    });
    await prisma.productSpec.deleteMany({ where: { productId: product.id } });
    await prisma.productSpec.createMany({
      data: [...p.specs, ["SKU", p.sku] as [string, string], ["HSN code", p.hsn] as [string, string]].map(([label, value], idx) => ({
        productId: product.id,
        label,
        value,
        sortOrder: idx,
      })),
    });
    await prisma.productFaq.deleteMany({ where: { productId: product.id } });
    const productFaqs: [string, string][] = [
      ...(p.faqs ?? []),
      ["Is this product genuine?", "Yes. Every Carsappo product is sourced from the brand or its authorised distributor and quality-checked before dispatch."],
      ["How soon will I receive it?", "Orders are dispatched within 24 hours. Delhi NCR in 1–3 days, rest of India in 3–7 days."],
    ];
    await prisma.productFaq.createMany({
      data: productFaqs.map(([question, answer], idx) => ({ productId: product.id, question, answer, sortOrder: idx })),
    });

    await prisma.productCompatibility.deleteMany({ where: { productId: product.id } });
    const modelIds = p.fit === "all-cars" ? carModelIds : p.fit === "all-bikes" ? bikeModelIds : p.fit === "popular" ? popularIds : [];
    if (modelIds.length) {
      await prisma.productCompatibility.createMany({ data: modelIds.map((vehicleModelId) => ({ productId: product.id, vehicleModelId })) });
    }
  }

  // Frequently bought together (explicit pairs)
  const pairs: [string, string[]][] = [
    ["7d-premium-car-mats-custom-fit", ["portable-car-vacuum-cleaner-120w", "microfiber-cloth-800gsm-pack-of-3"]],
    ["premium-leatherette-seat-covers", ["memory-foam-neck-rest-lumbar-combo", "leather-steering-wheel-cover"]],
    ["tyre-polish-deep-black-500ml", ["dashboard-polish-matte-300ml", "microfiber-cloth-800gsm-pack-of-3"]],
    ["dashboard-polish-matte-300ml", ["tyre-polish-deep-black-500ml", "microfiber-cloth-800gsm-pack-of-3"]],
    ["portable-car-vacuum-cleaner-120w", ["microfiber-cloth-800gsm-pack-of-3", "detailing-brush-set-5pcs"]],
  ];
  for (const [from, to] of pairs) {
    await prisma.product.update({ where: { slug: from }, data: { boughtTogether: { set: to.map((s) => ({ slug: s })) } } });
  }
  console.log(`✓ ${categories.length} categories, ${brands.length} brands, ${products.length} products`);
}

async function seedContent() {
  for (const [i, plan] of servicePlans.entries()) {
    const data = { ...plan, price: paise(plan.price), sortOrder: i };
    await prisma.servicePlan.upsert({ where: { slug: plan.slug }, create: data, update: data });
  }

  for (const [scope, list] of Object.entries(faqs) as [keyof typeof faqs, readonly (readonly [string, string])[]][]) {
    if ((await prisma.faq.count({ where: { scope } })) > 0) continue;
    await prisma.faq.createMany({ data: list.map(([question, answer], i) => ({ scope, question, answer, sortOrder: i })) });
  }

  const blogCatIds = new Map<string, string>();
  for (const [i, c] of blogCategories.entries()) {
    const row = await prisma.blogCategory.upsert({ where: { slug: c.slug }, create: { ...c, sortOrder: i }, update: { sortOrder: i } });
    blogCatIds.set(c.slug, row.id);
  }
  for (const [i, p] of posts.entries()) {
    const data = {
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      coverImage: `/images/placeholders/blog/${p.slug}.svg`,
      categoryId: blogCatIds.get(p.category)!,
      tags: p.tags,
      readingMinutes: p.minutes,
      isPublished: true,
      publishedAt: new Date(Date.now() - (i + 1) * 5 * 864e5),
      metaDescription: p.excerpt,
    };
    await prisma.post.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: data });
  }

  if ((await prisma.banner.count()) === 0) {
    await prisma.banner.createMany({
      data: [
        {
          placement: "HOME_PROMO",
          eyebrow: "Monsoon Ready",
          title: "Up to 40% off on 7D mats & body covers",
          subtitle: "Waterproof, custom-fit protection for your car this season.",
          ctaLabel: "Shop the sale",
          ctaHref: "/shop?offers=1",
          sortOrder: 0,
        },
      ],
    });
  }

  if ((await prisma.coupon.count()) === 0) {
    await prisma.coupon.createMany({
      data: [
        { code: "WELCOME10", description: "10% off your first order (up to ₹500)", type: "PERCENT", value: 10, maxDiscount: 50000, perUserLimit: 1, isPublic: true },
        { code: "CARCARE150", description: "₹150 off on orders above ₹1,499", type: "FLAT", value: 15000, minOrder: 149900, isPublic: true },
      ],
    });
  }
  console.log(`✓ ${servicePlans.length} service plans, FAQs, ${posts.length} blog posts, banners, coupons`);
}

async function seedDemo() {
  if ((await prisma.testimonial.count()) === 0) {
    await prisma.testimonial.createMany({
      data: testimonials.map((t, i) => ({
        type: t.type,
        name: t.name,
        location: t.location,
        rating: t.rating,
        content: t.content,
        mediaUrl: "art" in t && t.art ? `/images/placeholders/reviews/review-${i + 1}.svg` : null,
        sortOrder: i,
      })),
    });
  }

  const all = await prisma.product.findMany({ select: { id: true, _count: { select: { reviews: true } } } });
  for (const [pi, p] of all.entries()) {
    if (p._count.reviews > 0) continue;
    const n = 2 + (pi % 4);
    const picks = Array.from({ length: n }, (_, k) => sampleReviews[(pi + k) % sampleReviews.length]);
    await prisma.review.createMany({
      data: picks.map(([name, rating, title, body], k) => ({
        productId: p.id,
        name,
        rating,
        title,
        body,
        isApproved: true,
        isVerified: k % 2 === 0,
        createdAt: new Date(Date.now() - (k + 1) * 3 * 864e5),
      })),
    });
    const agg = await prisma.review.aggregate({ where: { productId: p.id, isApproved: true }, _avg: { rating: true }, _count: { _all: true } });
    await prisma.product.update({ where: { id: p.id }, data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count._all } });
  }

  if ((await prisma.order.count()) === 0) {
    const catalog = await prisma.product.findMany({ select: { id: true, name: true, sku: true, price: true, gstRate: true, hsnCode: true, images: { take: 1, select: { url: true } } } });
    const people = [
      ["Rohit Sharma", "Noida", "Uttar Pradesh", "201301"],
      ["Priya Menon", "Bengaluru", "Karnataka", "560034"],
      ["Aman Khanna", "Greater Noida", "Uttar Pradesh", "201310"],
      ["Sneha Patil", "Pune", "Maharashtra", "411014"],
      ["Vikas Yadav", "Gurugram", "Haryana", "122002"],
      ["Neha Gupta", "New Delhi", "Delhi", "110017"],
      ["Karan Mehta", "Mumbai", "Maharashtra", "400076"],
      ["Arjun Reddy", "Hyderabad", "Telangana", "500081"],
    ];
    const statuses: OrderStatus[] = ["DELIVERED", "DELIVERED", "DELIVERED", "SHIPPED", "CONFIRMED", "PROCESSING", "DELIVERED", "CANCELLED"];
    let invoiceSeq = 0;
    for (let i = 0; i < 36; i++) {
      const [name, city, state, pincode] = people[i % people.length];
      const lines = Array.from({ length: 1 + (i % 3) }, (_, k) => catalog[(i * 7 + k * 5) % catalog.length]);
      const unique = [...new Map(lines.map((l) => [l.id, l])).values()];
      const subtotal = unique.reduce((a, l) => a + l.price * (1 + ((i + 1) % 2)), 0);
      const shippingFee = subtotal >= 99900 ? 0 : 7900;
      const status = statuses[i % statuses.length];
      const createdAt = new Date(Date.now() - (i * 0.8 + 0.2) * 864e5);
      const cod = i % 4 === 0;
      invoiceSeq += status === "CANCELLED" ? 0 : 1;
      await prisma.order.create({
        data: {
          orderNumber: `CS${100000 + i + 1}`,
          email: `${name.split(" ")[0].toLowerCase()}@example.com`,
          phone: "9876543210",
          shipName: name,
          shipPhone: "9876543210",
          shipLine1: `${10 + i}, Sample Residency`,
          shipCity: city,
          shipState: state,
          shipPincode: pincode,
          subtotal,
          shippingFee,
          taxTotal: Math.round(subtotal * 0.15),
          total: subtotal + shippingFee,
          status,
          paymentMethod: cod ? "COD" : "RAZORPAY",
          paymentStatus: status === "CANCELLED" ? "REFUNDED" : cod && status !== "DELIVERED" ? "PENDING" : "PAID",
          stockCommitted: status !== "CANCELLED",
          invoiceNumber: status === "CANCELLED" ? null : `CS/DEMO/${String(invoiceSeq).padStart(5, "0")}`,
          invoiceDate: status === "CANCELLED" ? null : createdAt,
          createdAt,
          items: {
            create: unique.map((l) => ({
              productId: l.id,
              name: l.name,
              sku: l.sku,
              image: l.images[0]?.url,
              price: l.price,
              quantity: 1 + ((i + 1) % 2),
              gstRate: l.gstRate,
              hsnCode: l.hsnCode,
            })),
          },
          events: { create: [{ status: "CONFIRMED", note: "Payment received", createdAt }, ...(status !== "CONFIRMED" ? [{ status, createdAt }] : [])] },
        },
      });
    }
    await prisma.counter.upsert({ where: { key: "order" }, create: { key: "order", value: 36 }, update: { value: 36 } });
  }
  console.log("✓ Demo testimonials, reviews and orders");
}

async function main() {
  await seedAdmin();
  await seedCatalog();
  await seedContent();
  if (DEMO) await seedDemo();
  else console.log("ℹ Skipped demo reviews/orders (set SEED_DEMO=true to include them)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
