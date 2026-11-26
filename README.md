# Madina Mobile Gadgets — E-Commerce Platform

Online store and admin panel for **MADINA MOBILE GADGETS** (Mobile Gadgets | Wholesale & Retail),
Medical Bazaar, near Akhtar Plaza, Haroonabad · Proprietor Rashid Aslam · WhatsApp 0301-6597269.

The storefront and the admin panel (`/admin`) live in one Next.js project and deploy to Vercel as a single app.

## Tech stack

- Next.js 16 (App Router, React 19, TypeScript, Turbopack)
- MongoDB + Mongoose
- Email/password auth: bcrypt hashes, signed JWT session cookie, roles `customer` / `admin`
- Cloudinary for product and category images (uploaded through the server from the admin)
- Tailwind CSS v4, shadcn/ui (Base UI), Lucide icons
- React Hook Form + Zod (the same schemas validate on the server), Sonner toasts, Zustand (persisted cart)
- Cash on Delivery is the only payment method

## Features

**Storefront**
- Home page: hero with banner, categories, best sellers, latest products, promos, wholesale section, brands, why us, testimonials, and a floating WhatsApp button.
- Shop and category pages: search, category, brand, price and stock filters, sort, pagination, and sale/new/best-seller/out-of-stock badges.
- Product page: gallery, variants (colour, size and so on), quantity, Add to Cart, Buy Now, WhatsApp inquiry, specifications, reviews, related products.
- Cart: persisted in the browser, works for guests, quantities capped at available stock, re-priced by the server on every visit.
- Guest or signed-in checkout (COD). Delivery charge and free-delivery threshold come from admin settings. The confirmation page shows the order number.
- Order tracking by order number plus phone number. Contact form, About page.
- WhatsApp: only `wa.me` links with prefilled messages that start "Assalam o Alaikum…". The site never claims a message was sent automatically; the customer taps Send themselves.

**Customer accounts (optional)**
- Register, login, forgot/reset password, profile, address book, change password.
- Order history with a status timeline, and Reorder.

**Admin panel (`/admin`, admin role only)**
- Dashboard with sales, order and stock stats.
- Products: create and edit, multi-image Cloudinary upload, variants, wholesale price, SEO fields, flags.
- Categories.
- Orders: status changes (stock is restored on cancel), tracking number and courier, internal notes, printable invoice.
- Customers and inquiries.
- Store settings: contact details, delivery charges, announcement bar, homepage text, social links.

**Security**
- Role checks in the proxy (middleware) and again in every server action and data function.
- Zod validation on the server for every input.
- Prices, discounts, stock and delivery fees are recalculated on the server; client prices are never trusted.
- Rate limiting on login, register, password reset, checkout, reviews, contact and tracking.
- Honeypot field on the contact form.
- Guest order pages need a secret token in the URL. Without it they return 404.
- Cloudinary secrets stay on the server. Images upload through an admin-only server action, never directly from the browser with keys.

**SEO**
- Per-page metadata, Open Graph tags, canonical URLs.
- JSON-LD: Store, Product, AggregateOffer, Review and BreadcrumbList.
- `sitemap.xml` and `robots.txt`. Private pages (cart, checkout, account, admin, orders) are noindex or disallowed.

## Local setup

Requirements: Node 20+ and Docker (or a MongoDB Atlas URI).

```bash
# 1. MongoDB
docker run -d --name madina-mongo -p 27017:27017 -v madina-mongo-data:/data/db mongo:7

# 2. Dependencies
npm install

# 3. Environment: copy env.sample to .env.local and fill in the values
cp env.sample .env.local
#    At minimum set MONGODB_URI and AUTH_SECRET (openssl rand -base64 48)

# 4. Seed demo categories, products, reviews, settings and the admin account
npm run seed

# 5. Run
npm run dev          # http://localhost:3000
```

### Demo accounts (created by the seed)

| Role     | Email                   | Password        |
|----------|-------------------------|-----------------|
| Admin    | `admin@madinamobile.pk` | `ChangeMe!2026` |
| Customer | `customer@example.com`  | `Customer123`   |

The admin details come from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. **Change the admin password before going live.**

## Environment variables

See `env.sample` for the full annotated list.

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | Local Docker or MongoDB Atlas connection string |
| `AUTH_SECRET` | yes in production | Signs session and reset tokens. Use a long random value. |
| `NEXT_PUBLIC_SITE_URL` | yes in production | e.g. `https://madinamobile.pk`. Used for SEO, the sitemap and reset links. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | for image uploads | Server-only. Without them, uploading in the admin shows an error; existing images still display. |
| `CLOUDINARY_FOLDER` | no | Upload folder (default `madina-mobile-gadgets`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` | no | For password-reset emails. If unset, the reset link is printed to the server log. |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | seed only | Initial admin account |

Demo products use local placeholder images in `public/demo/`. Real products should be uploaded through the admin, which stores them on Cloudinary.

## Deploying to Vercel

1. Create a MongoDB Atlas cluster. Allow network access from Vercel (`0.0.0.0/0` or the Vercel integration) and copy the connection string.
2. Import the project into Vercel (framework preset: Next.js).
3. Add the environment variables above in Project → Settings → Environment Variables. `NEXT_PUBLIC_SITE_URL` must be your real domain.
4. Deploy.
5. Seed **once**, before the store has real data, from your machine against the production database:
   `MONGODB_URI="<atlas uri>" SEED_ADMIN_PASSWORD="<strong password>" npm run seed`
   The seed deletes all products, categories and orders, so never re-run it on a live store. Afterwards, replace or delete the demo products in the admin.
6. Sign in at `/admin/login` and review **Settings** (delivery charges, contact details, announcement bar).

**Rate-limit note:** the rate limiter keeps its counts in memory (`src/lib/rate-limit.ts`). On Vercel each serverless instance has its own counts, so limits are best-effort. For strict limits, swap in a shared store such as Upstash Redis.

## Project structure

```
src/
  app/
    (store)/            storefront: home, shop, category, product, cart, checkout,
                        order, track-order, contact, about, (auth), account
    admin/              /admin/login and the (panel) routes
    sitemap.ts, robots.ts
  actions/              server actions (auth, cart quote, checkout, account, admin…)
  services/             data access (catalog, orders, settings, account…)
  models/               Mongoose models
  lib/                  auth, validation schemas, pricing, WhatsApp messages, rate limit, env
  components/           store, product, checkout, account, admin, shared, ui (shadcn)
  proxy.ts              route protection (Next 16 "middleware")
scripts/seed.ts         demo data + admin account
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run seed` | **Wipes** categories, products, orders, reviews and inquiries, then reseeds demo data. Users are upserted, not wiped. Don't run against a live store with real orders. |
