# Carsappo — Everything Your Car Needs.

E-commerce website for **Carsappo**, a car care brand:

- **Primary business:** online store for premium car accessories & car care products, delivered across India.
- **Secondary business:** daily car cleaning service, available only in Greater Noida.

Built to the *"Carsappo Website Development Requirements v1.0"* brief: premium, minimal, automotive
look (black / white / Carsappo yellow, Poppins + Inter), mobile-first, SEO-ready and built to scale.

---

## Feature map (brief → implementation)

| Brief | Where |
|---|---|
| Hero banner, headline, sub-headings, *Shop Accessories* / *Explore Services* | `/` — admin can replace it with image banners (Admin → Banners) |
| Smart search with suggestions while typing | Hero + header search, `/api/search/suggest` |
| Shop by Vehicle: Brand → Model → Year → Fuel → compatible products | Homepage selector, shop "Compatibility" filter, "My Garage" memory, fit check on product pages |
| Shop by Category (Mats, Seat Covers, Car Care, Interior, Exterior, Electronics, Bike, Cleaning) | Homepage grid, `/category/[slug]`, mega-menu |
| Best Sellers (large slider), Featured (Latest / Premium / Trending) | Homepage |
| Why Carsappo, Customer Reviews (image / video / Google) | Homepage; testimonials in Admin, live Google reviews via Places API (optional) |
| Daily Car Cleaning section (Greater Noida only) + Book Service | Homepage, `/services`, `/services/book` (pincode-gated) |
| Instagram feed | Homepage (Instagram API token, falls back to a follow grid) |
| Navigation: Home, Shop, Services, Blog, About, Contact, Search, Wishlist, Cart, Login | Header (desktop mega-menu + mobile drawer) |
| Shop: search, categories, price, brand, compatibility, offers, availability, sort | `/shop` |
| Product: gallery, zoom, video, description, specs, compatibility, features, reviews, FAQs, related, frequently bought together, shipping info, return policy, Buy Now, Add to Cart, WhatsApp enquiry | `/product/[slug]` |
| Cart: summary, shipping, GST, coupon, estimated delivery, total | `/cart` (prices always recomputed on the server) |
| Checkout: guest checkout, login, address, payment, confirmation, invoice | `/checkout` → `/order/[no]` → `/invoice/[no]` |
| Customer dashboard: orders, wishlist, addresses, coupons, returns, notifications, invoices, track orders | `/account/*` |
| Services page: daily cleaning, interior cleaning, pricing plans, FAQs, book service, contact form | `/services` |
| Blog: car care tips, buying guides, comparisons, maintenance, SEO articles | `/blog`, `/blog/category/[slug]`, `/blog/[slug]` |
| Admin: products, categories, orders, customers, inventory, coupons, reviews, blogs, banners, shipping, GST invoices, analytics, SEO settings | `/admin/*` |
| Payments: Razorpay — UPI, debit/credit cards, net banking | Razorpay Checkout + server-side signature verification + webhook |
| Shipping: Shiprocket — tracking, labels, delivery status | Admin order actions + `/api/webhooks/shipping` |
| SEO: friendly URLs, meta titles/descriptions, image optimisation, schema, sitemap, fast loading | `next/image`, JSON-LD (Organization, WebSite, Product, Breadcrumb, FAQ, Article, LocalBusiness), `/sitemap.xml`, `/robots.txt` |
| GA4, GTM, Meta Pixel, Google Ads conversion tracking | IDs in Admin → SEO & Tracking; ecommerce events (view_item, add_to_cart, begin_checkout, purchase…) |

Also included: GST tax invoices (CGST/SGST vs IGST by place of supply, HSN/SAC, amount in words,
financial-year numbering), COD with fee and limits, order cancellation with automatic Razorpay refund,
return requests, email notifications, WhatsApp floating button, policy pages, guest order tracking.

## Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **PostgreSQL** + **Prisma 6**
- Razorpay, Shiprocket, SMTP (nodemailer), optional S3-compatible storage, Instagram & Google Places APIs

Money is stored as integer **paise**; product prices are **GST-inclusive**.

## Local development

Requirements: Node.js 20.9+ and PostgreSQL 14+ (or Docker).

```bash
cp .env.example .env            # then set AUTH_SECRET (openssl rand -base64 48)
docker compose up -d            # local Postgres (or point DATABASE_URL at your own)
npm install
npx prisma migrate deploy       # create tables
SEED_DEMO=true ADMIN_PASSWORD='choose-a-password' npm run db:seed
npm run dev                     # http://localhost:3000  ·  admin at /admin
```

`npm run db:seed` loads the starter catalogue (38 products, 8 categories, 55+ vehicle models, service
plans, FAQs, blog posts, coupons `WELCOME10` / `CARCARE150`). `SEED_DEMO=true` additionally adds sample
reviews, testimonials and orders so the analytics and review sections have data — **don't use it on the live site.**

Without Razorpay keys, checkout offers Cash on Delivery only. Without SMTP, emails are logged to the console.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` · `npm run typecheck` · `npm test` | ESLint · TypeScript · unit tests (GST, pricing, validators) |
| `npm run db:migrate` | Create a new migration after editing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed / refresh starter data (idempotent) |
| `npm run placeholders` | Regenerate the branded placeholder images |
| `npm run test:e2e` | Full end-to-end suite (see *Testing*) |

## Testing

`npm test` runs the unit tests (GST split, pricing, validators, redirects). `npm run test:e2e` runs
**~120 Playwright tests** against a production build, on desktop (1440px) and a phone (Pixel 7):

- **Storefront** — every homepage section, smart search, shop-by-vehicle, all shop filters/sorts, product
  page (gallery, zoom, video, specs, compatibility, FAQs, FBT, pincode check, fit check, reviews, WhatsApp),
  cart maths (GST, shipping threshold, coupons, COD fee), guest + signed-in checkout, Razorpay payment /
  retry / webhook, COD, GST invoices, emails, customer dashboard, returns, password reset, order tracking.
- **Services & content** — booking (pincode-gated to Greater Noida), plans, FAQs, contact, blog, policies, 404s.
- **Admin** — products (with image upload), inventory + CSV, orders → Shiprocket shipment / AWB / pickup /
  label / tracking, status emails, COD collection, partial + full Razorpay refunds, returns + restock,
  coupons, reviews, banners, testimonials, blog, settings, SEO & tracking tags, access control.
- **Quality gates** — no horizontal scrolling at 360 / 390 / 768 / 1024 / 1280 / 1920px, axe WCAG 2.1 AA
  (no serious/critical issues), unique titles/descriptions/canonicals, JSON-LD, sitemap/robots, security
  headers, open-redirect and XSS checks, server-side price integrity, webhook signatures.

Razorpay and Shiprocket are replaced by a local mock server and emails are written to
`test-results/outbox`, so the suite needs no real keys or internet. Each run creates a fresh database
`carsappo_e2e_<timestamp>` on the local Postgres (override with `E2E_POSTGRES_URL`, or set
`E2E_DATABASE_URL` to use an existing empty database as CI does). The HTML report is in `playwright-report/`.
CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, build and the full e2e suite on every push.

## Deployment

### Option A — VPS (recommended for simplicity; e.g. Hostinger / DigitalOcean / AWS Lightsail, Mumbai region)

1. Install Node 20+, PostgreSQL, Nginx and PM2.
2. Clone the repo, create `.env` from `.env.example` (set `NEXT_PUBLIC_SITE_URL=https://carsappo.com`, a strong `AUTH_SECRET`, `UPLOAD_DIR=/var/carsappo/uploads`).
3. `npm ci && npx prisma migrate deploy && npm run db:seed && npm run build`
4. `pm2 start npm --name carsappo -- start` and proxy Nginx → `localhost:3000`; add HTTPS with `certbot --nginx -d carsappo.com -d www.carsappo.com`.
5. Point the domain's DNS `A` records (`@` and `www`) to the server IP.

### Option A2 — VPS with Docker

```bash
cp .env.example .env        # fill in real values and add POSTGRES_PASSWORD=<strong password>
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npm run db:seed    # first deploy only
```

The app listens on `127.0.0.1:3000`; migrations run automatically on start and uploads live in a volume.

**Reverse proxy (either option):** Nginx must pass the client IP, which rate limiting relies on:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  client_max_body_size 50m;   # admin video uploads
}
```

Never set `RATE_LIMIT_DISABLED` in production — it exists only for the test suite.

### Option B — Vercel + managed Postgres

Use Neon / Supabase / Vercel Postgres for `DATABASE_URL`, and configure the `S3_*` variables
(e.g. Cloudflare R2) because serverless hosts have no persistent disk for uploads. Set the build command to
`prisma migrate deploy && npm run build`. Add `carsappo.com` in Vercel → Domains and update DNS as instructed.

## Integrations checklist

1. **Razorpay** — create API keys (start in *Test mode*), set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`, add the webhook `https://carsappo.com/api/webhooks/razorpay` with `payment.captured`, `order.paid`, `payment.failed`, `refund.processed` and set `RAZORPAY_WEBHOOK_SECRET`. Complete KYC before switching to live keys.
2. **Shiprocket** — add a pickup location (its name must match Admin → Shipping → *Pickup location*), create an API user and set `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD`. Add the webhook `https://carsappo.com/api/webhooks/shipping` with a token and set `SHIPROCKET_WEBHOOK_TOKEN`. Recharge the wallet before assigning AWBs.
3. **Email** — set the `SMTP_*` variables and `MAIL_FROM` (use a domain mailbox with SPF/DKIM configured).
4. **Tracking** — enter GA4, GTM, Meta Pixel and Google Ads IDs in **Admin → SEO & Tracking**. Submit `https://carsappo.com/sitemap.xml` in Google Search Console.
5. **Instagram / Google reviews** (optional) — set `INSTAGRAM_ACCESS_TOKEN`, `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID`.

## Go-live checklist

- [ ] Admin → Settings: legal name, **GSTIN**, business address/state, phone, **WhatsApp number**, email, logo, social links.
- [ ] Replace placeholder product/category images with real photos; review prices, stock, HSN codes and GST rates.
- [ ] Delete demo reviews/testimonials/orders if `SEED_DEMO=true` was ever used on the database.
- [ ] Review the policy pages (`src/lib/policies.ts`) with your CA / legal advisor.
- [ ] Confirm serviceable Greater Noida pincodes and service plan prices (Admin → Services).
- [ ] Run a real ₹1 Razorpay test order and a COD order end-to-end; check the invoice and emails.
- [ ] Change the admin password (Admin → Settings) and keep `AUTH_SECRET` private.

## Project structure

```
prisma/               schema, migrations, seed + starter data
scripts/              placeholder image generator
src/app/(store)/      storefront routes (home, shop, product, cart, checkout, account, services, blog…)
src/app/admin/        admin panel
src/app/api/          search, cart quote, checkout, payments, webhooks, uploads
src/app/invoice/      printable GST invoice
src/components/       UI kit, layout, home, product, shop, checkout, account, order, admin
src/lib/              data access, auth, pricing/GST, orders, Razorpay, Shiprocket, SEO, settings
src/store/            client stores (cart, wishlist, garage)
tests/                unit tests; tests/e2e/ Playwright suite, mocks and helpers
```
