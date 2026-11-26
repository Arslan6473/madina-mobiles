/**
 * Seeds demo data: categories, products, settings, an admin, a demo customer,
 * sample orders, reviews and inquiries.
 *
 *   npm run seed            # wipe catalog/orders/reviews/inquiries and reseed
 *
 * Users are upserted (never wiped) so a real admin account is preserved.
 */
import { randomBytes } from "node:crypto";
import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import { Category, Inquiry, Order, Product, Review, StoreSettings, User } from "../src/models";
import { categories, demoReviews, products } from "./seed-data";
import { renderArt, writeDemoImage } from "./demo-images";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/madina-mobile-gadgets";
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? "admin@madinamobile.pk").toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026";
const CUSTOMER_EMAIL = "customer@example.com";
const CUSTOMER_PASSWORD = "Customer123";

/** Per-product icon overrides where the category icon doesn't fit well. */
const ICON_BY_SKU: Record<string, string> = {
  "EP-SBASS35": "headphones",
  "CH-CAR38W": "car",
  "CB-3IN1": "usb",
  "MC-SDDUAL": "usb",
  "SP-LENS": "aperture",
  "ACC-CARHOLD": "car",
  "PB-MAG5K": "battery-full",
  "CH-MI67W": "zap",
  "SPK-PARTY40": "speaker",
  "HF-VIVOXE": "mic",
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000 - Math.floor(Math.random() * 36e5 * 8));

async function main() {
  console.log(`→ Connecting to ${MONGODB_URI.replace(/\/\/[^@]*@/, "//***@")}`);
  await mongoose.connect(MONGODB_URI);

  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Inquiry.deleteMany({}),
  ]);
  await Promise.all([Category.syncIndexes(), Product.syncIndexes(), Order.syncIndexes(), User.syncIndexes(), Review.syncIndexes()]);

  /* ---------- settings ---------- */
  await StoreSettings.updateOne(
    { key: "store" },
    {
      $setOnInsert: { key: "store" },
      $set: { social: { facebook: "https://facebook.com/", instagram: "https://instagram.com/", tiktok: "https://tiktok.com/" } },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );
  console.log("✓ Store settings");

  /* ---------- categories ---------- */
  const catIds = new Map<string, Types.ObjectId>();
  for (const [i, c] of categories.entries()) {
    const url = writeDemoImage(`category-${c.slug}.svg`, renderArt({ icon: c.icon, palette: i, variant: 1 }));
    const doc = await Category.create({
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      image: { url, alt: c.name },
      sortOrder: i,
      isActive: true,
    });
    catIds.set(c.slug, doc._id);
  }
  console.log(`✓ ${categories.length} categories`);

  /* ---------- products ---------- */
  const productDocs = new Map<string, { _id: Types.ObjectId; name: string; slug: string; sku: string; price: number; salePrice?: number; image: string; variants: { _id: Types.ObjectId; label: string }[] }>();
  for (const [i, p] of products.entries()) {
    const cat = categories.find((c) => c.slug === p.category)!;
    const icon = ICON_BY_SKU[p.sku] ?? cat.icon;
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const images = [0, 1].map((variant) => ({
      url: writeDemoImage(`${slug}-${variant + 1}.svg`, renderArt({ icon, label: p.name, sub: p.brand, palette: i, variant })),
      alt: p.name,
    }));
    const variants = (p.variants ?? []).map((v, vi) => ({
      _id: new Types.ObjectId(),
      sku: v.sku ?? `${p.sku}-${vi + 1}`,
      attributes: v.attributes,
      price: v.price,
      salePrice: v.salePrice,
      stock: v.stock,
    }));
    const stock = variants.length ? variants.reduce((s, v) => s + v.stock, 0) : p.stock;
    const doc = await Product.create({
      name: p.name,
      slug,
      sku: p.sku,
      shortDescription: p.shortDescription,
      description: p.description,
      category: catIds.get(p.category),
      brand: p.brand,
      tags: p.tags,
      price: p.price,
      salePrice: p.salePrice,
      wholesalePrice: p.wholesalePrice,
      wholesaleMinQty: p.wholesaleMinQty,
      stock,
      images,
      specifications: p.specifications.map(([label, value]) => ({ label, value })),
      variants,
      isFeatured: !!p.featured,
      isBestSeller: !!p.bestSeller,
      isNewArrival: !!p.newArrival,
      isPublished: true,
      soldCount: p.soldCount ?? 0,
      seo: { title: `${p.name} Price in Pakistan`, description: p.shortDescription },
      createdAt: daysAgo(p.newArrival ? i % 7 : 20 + i),
    });
    productDocs.set(p.sku, {
      _id: doc._id,
      name: p.name,
      slug,
      sku: p.sku,
      price: p.price,
      salePrice: p.salePrice,
      image: images[0].url,
      variants: variants.map((v) => ({ _id: v._id, label: v.attributes.map((a) => a.value).join(" / ") })),
    });
  }
  console.log(`✓ ${products.length} products (+ placeholder art in public/demo)`);

  /* ---------- users ---------- */
  const admin = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: { role: "admin", isActive: true },
      $setOnInsert: { name: "Rashid Aslam", phone: "03016597269", passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12) },
    },
    { upsert: true, returnDocument: "after" },
  );
  const customer = await User.findOneAndUpdate(
    { email: CUSTOMER_EMAIL },
    {
      $set: { isActive: true },
      $setOnInsert: {
        name: "Ahmed Hassan",
        phone: "03001234567",
        role: "customer",
        passwordHash: await bcrypt.hash(CUSTOMER_PASSWORD, 12),
        addresses: [
          {
            label: "Home",
            fullName: "Ahmed Hassan",
            phone: "03001234567",
            address: "House 12, Street 4, Model Town",
            city: "Bahawalnagar",
            province: "Punjab",
            country: "Pakistan",
            isDefault: true,
          },
        ],
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  console.log(`✓ Admin ${ADMIN_EMAIL} · Customer ${CUSTOMER_EMAIL}`);

  /* ---------- orders ---------- */
  const settings = await StoreSettings.findOne({ key: "store" }).lean();
  const deliveryCharge = settings?.deliveryCharge ?? 250;
  const threshold = settings?.freeDeliveryThreshold ?? 5000;

  type Line = { sku: string; qty: number; variant?: number };
  const orderSpecs: { lines: Line[]; status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"; days: number; mine?: boolean; name: string; phone: string; city: string }[] = [
    { lines: [{ sku: "CH-SMG25W", qty: 1 }, { sku: "CB-CC60W", qty: 2, variant: 0 }], status: "delivered", days: 24, mine: true, name: "Ahmed Hassan", phone: "03001234567", city: "Bahawalnagar" },
    { lines: [{ sku: "EB-AIRPRO2", qty: 1 }], status: "shipped", days: 3, mine: true, name: "Ahmed Hassan", phone: "03001234567", city: "Bahawalnagar" },
    { lines: [{ sku: "PB-10K-SLIM", qty: 1, variant: 1 }, { sku: "SP-9DGLASS", qty: 2, variant: 0 }], status: "pending", days: 0, name: "Zainab Bibi", phone: "03211234567", city: "Haroonabad" },
    { lines: [{ sku: "SP-9DGLASS", qty: 50, variant: 3 }, { sku: "EP-SBASS35", qty: 30 }], status: "confirmed", days: 1, name: "Bilal Mobile Zone", phone: "03451234567", city: "Chishtian" },
    { lines: [{ sku: "ACC-SW9", qty: 1, variant: 0 }], status: "processing", days: 2, name: "Hira Saleem", phone: "03331234567", city: "Lahore" },
    { lines: [{ sku: "MC-SDULTRA", qty: 1, variant: 1 }], status: "delivered", days: 9, name: "Usman Tariq", phone: "03121234567", city: "Fort Abbas" },
    { lines: [{ sku: "CH-IPH20W", qty: 1 }, { sku: "CB-LTN1M", qty: 1 }], status: "delivered", days: 14, name: "Sana Malik", phone: "03011234567", city: "Lahore" },
    { lines: [{ sku: "SPK-JBLGO3", qty: 1, variant: 1 }], status: "cancelled", days: 6, name: "Kamran Ali", phone: "03061234567", city: "Multan" },
    { lines: [{ sku: "CS-IPHSIL", qty: 2, variant: 2 }, { sku: "SP-LENS", qty: 1 }], status: "delivered", days: 18, name: "Ayesha Khan", phone: "03081234567", city: "Haroonabad" },
    { lines: [{ sku: "HF-TYPEC", qty: 1 }], status: "delivered", days: 27, name: "Ali Raza", phone: "03091234567", city: "Bahawalnagar" },
  ];

  const flow = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;
  for (const [i, spec] of orderSpecs.entries()) {
    const created = daysAgo(spec.days);
    const items = spec.lines.map((l) => {
      const p = productDocs.get(l.sku)!;
      const v = l.variant !== undefined ? p.variants[l.variant] : undefined;
      const src = products.find((x) => x.sku === l.sku)!;
      const sv = l.variant !== undefined ? src.variants?.[l.variant] : undefined;
      const unitPrice = sv?.salePrice ?? sv?.price ?? src.salePrice ?? src.price;
      return {
        product: p._id,
        variantId: v?._id,
        variantLabel: v?.label,
        name: p.name,
        slug: p.slug,
        sku: l.sku,
        image: p.image,
        unitPrice,
        quantity: l.qty,
        lineTotal: unitPrice * l.qty,
      };
    });
    const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
    const shippingFee = threshold > 0 && subtotal >= threshold ? 0 : deliveryCharge;
    const history =
      spec.status === "cancelled"
        ? [
            { status: "pending" as const, at: created, note: "Order placed" },
            { status: "cancelled" as const, at: new Date(created.getTime() + 36e5 * 5), note: "Customer cancelled on call", by: "Rashid Aslam" },
          ]
        : flow.slice(0, flow.indexOf(spec.status) + 1).map((s, si) => ({
            status: s,
            at: new Date(created.getTime() + si * 36e5 * 14),
            note: si === 0 ? "Order placed" : undefined,
            by: si === 0 ? undefined : "Rashid Aslam",
          }));
    const ymd = created.toISOString().slice(2, 10).replace(/-/g, "");
    await Order.create({
      orderNumber: `MMG-${ymd}-${String(10001 + i * 137).slice(0, 5)}`,
      accessToken: randomBytes(24).toString("base64url"),
      user: spec.mine ? customer!._id : undefined,
      customer: { name: spec.name, phone: spec.phone, email: spec.mine ? CUSTOMER_EMAIL : undefined, whatsapp: spec.phone },
      shippingAddress: { address: `Shop/House ${10 + i}, Main Bazaar`, city: spec.city, province: "Punjab", country: "Pakistan" },
      items,
      subtotal,
      shippingFee,
      discount: 0,
      total: subtotal + shippingFee,
      currency: "PKR",
      paymentMethod: "cod",
      paymentStatus: spec.status === "delivered" ? "paid" : "unpaid",
      status: spec.status,
      statusHistory: history,
      tracking: ["shipped", "delivered"].includes(spec.status) ? { courier: "TCS", trackingNumber: `TCS${770000 + i * 31}` } : undefined,
      internalNotes: i === 3 ? [{ note: "Wholesale customer — confirmed rates on WhatsApp.", by: "Rashid Aslam", at: created }] : [],
      cancelledAt: spec.status === "cancelled" ? new Date(created.getTime() + 36e5 * 5) : undefined,
      deliveredAt: spec.status === "delivered" ? new Date(created.getTime() + 4 * 36e5 * 14) : undefined,
      createdAt: created,
    });
  }
  console.log(`✓ ${orderSpecs.length} sample orders`);

  /* ---------- reviews (demo, attributed to the seed customer for uniqueness by product) ---------- */
  for (const r of demoReviews) {
    const p = productDocs.get(r.sku);
    if (!p) continue;
    await Review.create({
      product: p._id,
      user: new Types.ObjectId(), // anonymous demo reviewer
      name: `${r.name}, ${r.city}`,
      rating: r.rating,
      comment: r.comment,
      isApproved: true,
    });
    const stats = await Review.aggregate([{ $match: { product: p._id, isApproved: true } }, { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } }]);
    await Product.updateOne({ _id: p._id }, { ratingAvg: Math.round((stats[0]?.avg ?? 0) * 10) / 10, ratingCount: stats[0]?.n ?? 0 });
  }
  console.log(`✓ ${demoReviews.length} reviews`);

  /* ---------- inquiries ---------- */
  await Inquiry.create([
    { name: "Imran Shah", phone: "03151234567", subject: "Wholesale price list", message: "Assalam o Alaikum, I have a mobile shop in Minchinabad. Please share wholesale rates for chargers and cables.", status: "new" },
    { name: "Maria Noor", email: "maria@example.com", subject: "Order delivery time", message: "How many days does delivery take to Karachi?", status: "read" },
    { name: "Faisal Javed", phone: "03221234567", subject: "Samsung Buds FE warranty", message: "Is the Galaxy Buds FE official warranty or local?", status: "resolved" },
  ]);
  console.log("✓ 3 inquiries");

  console.log(`\nDone. Admin login: ${ADMIN_EMAIL} / ${process.env.SEED_ADMIN_PASSWORD ? "(from SEED_ADMIN_PASSWORD)" : ADMIN_PASSWORD}`);
  console.log(`Demo customer: ${CUSTOMER_EMAIL} / ${CUSTOMER_PASSWORD}`);
  void admin;
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
