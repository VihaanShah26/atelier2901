// import * as functions from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { Resend } from "resend";

initializeApp();
const db = getFirestore();

const ORDERABLE_COLLECTIONS = new Set<string>([
  "stationery_essential",
  "stationery_premium",
  "stationery_money",
  "stationery_hampers",
  "gifting_travel",
  "gifting_coasters",
  "gifting_wine",
  "hampers",
]);

const DEFAULT_ALLOWED_ORIGINS = [
  "https://atelier2901.com",
  "https://www.atelier2901.com",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5173",
];

const MAX_ORDER_ITEMS = 25;
const MAX_QUANTITY = 99;
const PRODUCT_ID_PATTERN = /^[a-zA-Z0-9._-]{1,80}$/;

class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ---- Secrets ----
// const RESEND_API_KEY = process.env.RESEND_API_KEY!;
// const EMAIL_FROM = process.env.EMAIL_FROM!;
// const STUDIO_EMAIL = process.env.STUDIO_EMAIL!;

// const resend = new Resend(RESEND_API_KEY);
function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Throw a clear error only when the endpoint is invoked
    throw new Error("RESEND_API_KEY is not set in environment/secrets.");
  }
  return new Resend(key);
}

function getEnvOrThrow(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set in environment/secrets.`);
  return v;
}

// ---- Express app ----
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true);

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(express.json({ limit: "20kb", type: "application/json" }));

// If your frontend calls same domain, CORS is not needed, but safe to allow your site:
app.use(cors({
  origin(origin, callback) {
    if (!origin || getAllowedOrigins().has(origin)) {
      callback(null, true);
      return;
    }
    callback(new ApiError(403, "Origin is not allowed."));
  },
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  maxAge: 600,
}));

app.use((req, res, next) => {
  if (req.method === "OPTIONS" || req.method === "GET") {
    next();
    return;
  }
  if (!req.is("application/json")) {
    res.status(415).json({ ok: false, message: "Content-Type must be application/json." });
    return;
  }
  next();
});

// ---- Simple in-memory rate limit (per IP) ----
const RATE_WINDOW_MS = 5 * 60 * 1000; // 5 min
const ipHits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const entry = ipHits.get(key);
  if (!entry || entry.resetAt < now) {
    ipHits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

function getClientIp(req: Request) {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
    || req.ip
    || req.socket.remoteAddress
    || "unknown";
}

function getAllowedOrigins() {
  const configured = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
}

function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value)
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 ||
        (code >= 32 && code !== 127);
    })
    .join("")
    .trim()
    .slice(0, maxLength);
}

function cleanHeaderText(value: unknown, maxLength: number) {
  return cleanText(value, maxLength).replace(/[\r\n]+/g, " ");
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parsePositiveInteger(value: unknown, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_QUANTITY);
}

function parseProductImages(img: unknown) {
  if (typeof img !== "string") return [];
  return img
    .split(/\r?\n/)
    .map((src) => src.trim())
    .filter(Boolean);
}

function formatCurrency(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return "Price not set";
  return `Rs. ${numberValue.toLocaleString("en-IN")}`;
}

function formatOrderItems(items: unknown[]) {
  return items.map((rawItem, index: number) => {
    const it = asRecord(rawItem);
    const nm = cleanText(it.name, 120) || "ATELIER 2901";
    const qty = Number(it.quantity) || 1;
    const unitPrice = typeof it.price === "number" ? it.price : null;
    const lineTotal = unitPrice === null ? null : unitPrice * qty;
    const details = [
      `  Quantity: ${qty}`,
      `  Unit price: ${unitPrice === null ? "Price not set" : formatCurrency(unitPrice)}`,
      `  Line total: ${lineTotal === null ? "Price not set" : formatCurrency(lineTotal)}`,
    ];

    if (it.personalize === "yes" || it.personalize === "no") {
      details.push(`  Personalized: ${it.personalize === "yes" ? "Yes" : "No"}`);
    }
    if (typeof it.greeting === "string" && it.greeting.trim()) {
      details.push(`  Greeting: ${it.greeting.trim()}`);
    }
    if (typeof it.personalizationName === "string" && it.personalizationName.trim()) {
      details.push(`  Name: ${it.personalizationName.trim()}`);
    }
    if (Array.isArray(it.personalizationDetails) && it.personalizationDetails.length > 0) {
      details.push("  Personalization details:");
      it.personalizationDetails.forEach((rawDetail: unknown, detailIndex: number) => {
        const detail = asRecord(rawDetail);
        const set = Number(detail.set) || detailIndex + 1;
        const greeting =
          typeof detail.greeting === "string" && detail.greeting.trim()
            ? detail.greeting.trim()
            : "None";
        const name =
          typeof detail.name === "string" && detail.name.trim()
            ? detail.name.trim()
            : "None";
        details.push(`    Set ${set}: Greeting: ${greeting}; Name: ${name}`);
      });
    }
    if (typeof it.initials === "string" && it.initials.trim()) {
      details.push(`  Initials: ${it.initials.trim()}`);
    }
    if (typeof it.size === "string" && it.size.trim()) {
      details.push(`  Size: ${it.size.trim()}`);
    }
    if (it.goldFoil === "yes" || it.goldFoil === "no") {
      details.push(`  Gold foil: ${it.goldFoil === "yes" ? "Yes" : "No"}`);
    }

    return `${index + 1}. ${nm}\n${details.join("\n")}`;
  }).join("\n\n");
}

function getDisplayOrderId(orderId: string) {
  return orderId.trim().slice(-6).toUpperCase();
}

function isStationeryProduct(category: string) {
  return [
    "stationery_essential",
    "stationery_premium",
    "stationery_money",
  ].includes(category);
}

function supportsGoldFoil(category: string, product: Record<string, unknown>) {
  return category === "stationery_premium" ||
    (category === "stationery_money" && product.goldFoil === true);
}

function numberOrNull(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function normalizeSizeOptions(product: Record<string, unknown>) {
  const rawSizes = Array.isArray(product.sizes) ? product.sizes : [];
  return rawSizes
    .map((size) => {
      const record = asRecord(size);
      return {
        label: cleanText(record.label, 80),
        price: numberOrNull(record.price),
        personalizedPrice: numberOrNull(record.personalizedPrice),
      };
    })
    .filter((size) => size.label && size.price !== null);
}

function resolveServerPrice(params: {
  category: string;
  product: Record<string, unknown>;
  personalize: "yes" | "no";
  size: string | null;
  goldFoil: "yes" | "no" | null;
}) {
  const sizeOptions = normalizeSizeOptions(params.product);
  let basePrice: number | null = null;
  let resolvedSize = params.size;

  if (sizeOptions.length > 0) {
    const sizeOption = params.size
      ? sizeOptions.find((size) => size.label === params.size)
      : sizeOptions.length === 1
        ? sizeOptions[0]
        : undefined;
    if (!sizeOption) {
      throw new ApiError(400, "A valid product size is required.");
    }
    resolvedSize = sizeOption.label;
    basePrice = params.personalize === "yes"
      ? sizeOption.personalizedPrice ?? sizeOption.price
      : sizeOption.price;
  } else if (params.personalize === "yes" && isStationeryProduct(params.category)) {
    basePrice = numberOrNull(params.product.personalizedPrice);
  } else {
    basePrice = numberOrNull(params.product.price);
  }

  if (basePrice === null) {
    throw new ApiError(400, "Product price is not configured.");
  }

  const goldFoilPrice = params.goldFoil === "yes"
    ? params.category === "stationery_money" ? 1000 : 600
    : 0;

  return {
    unitPrice: basePrice + goldFoilPrice,
    resolvedSize,
  };
}

async function normalizeOrderItem(rawItem: unknown) {
  const item = asRecord(rawItem);
  const category = cleanText(item.category, 80);
  if (!ORDERABLE_COLLECTIONS.has(category)) {
    throw new ApiError(400, "Invalid product category.");
  }

  const id = cleanText(item.id, 120);
  const prefix = `${category}-`;
  const productId = id.startsWith(prefix) ? id.slice(prefix.length) : cleanText(item.productId, 80);
  if (!PRODUCT_ID_PATTERN.test(productId)) {
    throw new ApiError(400, "Invalid product identifier.");
  }

  const productSnap = await db.collection(category).doc(productId).get();
  if (!productSnap.exists) {
    throw new ApiError(400, "Product is no longer available.");
  }

  const product: Record<string, unknown> = productSnap.data() || {};
  const quantity = parsePositiveInteger(item.quantity);
  const personalize = item.personalize === "yes" && isStationeryProduct(category) ? "yes" : "no";
  const requestedGoldFoil = item.goldFoil === "yes" ? "yes" : item.goldFoil === "no" ? "no" : null;
  const goldFoil = supportsGoldFoil(category, product) ? requestedGoldFoil : null;
  if (goldFoil === "yes" && category !== "stationery_money" && quantity < 2) {
    throw new ApiError(400, "Gold foil requires a minimum quantity of 2.");
  }

  const size = cleanText(item.size, 80) || null;
  const { unitPrice, resolvedSize } = resolveServerPrice({
    category,
    product,
    personalize,
    size,
    goldFoil,
  });

  const personalizationDetails = Array.isArray(item.personalizationDetails)
    ? item.personalizationDetails.slice(0, quantity).map((detail, index) => {
      const detailRecord = asRecord(detail);
      return {
        set: parsePositiveInteger(detailRecord.set, index + 1),
        greeting: cleanText(detailRecord.greeting, 35) || null,
        name: cleanText(detailRecord.name, 60) || null,
      };
    }).filter((detail) => detail.greeting || detail.name)
    : [];

  return {
    id: `${category}-${productId}`,
    productId,
    category,
    name: cleanText(product.name, 120) || "ATELIER 2901",
    img: parseProductImages(product.img)[0] || "",
    quantity,
    personalize,
    goldFoil,
    price: unitPrice,
    lineTotal: unitPrice * quantity,
    greeting: personalize === "yes" ? cleanText(item.greeting, 35) || null : null,
    personalizationName: personalize === "yes" ? cleanText(item.personalizationName, 60) || null : null,
    personalizationDetails,
    initials: category === "gifting_travel" ? cleanText(item.initials, 2) || null : null,
    size: resolvedSize || null,
  };
}

function handleApiError(err: unknown, res: Response, logLabel: string) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ ok: false, message: err.message });
  }
  console.error(logLabel, err);
  return res.status(500).json({ ok: false, message: "Server error." });
}

// ---- POST /api/contact ----
app.post("/api/contact", async (req, res) => {
  try {
    const ip = getClientIp(req);

    if (!rateLimit(`contact:${ip}`, 10)) {
      return res.status(429).json({ ok: false, message: "Too many requests. Please try again later." });
    }

    const { name, email, message, source, companyWebsite, phone } = req.body || {};

    // Honeypot: silently succeed to not tip off bots
    if (companyWebsite && String(companyWebsite).trim().length > 0) {
      return res.status(200).json({ ok: true });
    }

    const safeName = cleanHeaderText(name, 80);
    const safeEmail = cleanText(email, 254).toLowerCase();
    const safeMessage = cleanText(message, 2000);
    const safeSource = cleanText(source, 80) || "unknown";
    const safePhone = cleanText(phone, 30);

    if (!safeName) {
      return res.status(400).json({ ok: false, message: "Name is required." });
    }
    if (!safeEmail || !isValidEmail(safeEmail)) {
      return res.status(400).json({ ok: false, message: "Valid email is required." });
    }
    if (safeMessage.length < 10) {
      return res.status(400).json({ ok: false, message: "Message must be at least 10 characters." });
    }

    const resend = getResendClient();
    const EMAIL_FROM = getEnvOrThrow("EMAIL_FROM");
    const STUDIO_EMAIL = getEnvOrThrow("STUDIO_EMAIL");

    await resend.emails.send({
      from: EMAIL_FROM,
      to: STUDIO_EMAIL,
      replyTo: safeEmail,
      subject: `New message from ${safeName}`,
      text:
`Source: ${safeSource}

Name: ${safeName}
Email: ${safeEmail}

Message:
${safeMessage}

Phone:
${safePhone || "(not provided)"}
`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return handleApiError(err, res, "contact error");
  }
});

// ---- POST /api/orders ----
app.post("/api/orders", async (req, res) => {
  try {
    const ip = getClientIp(req);

    if (!rateLimit(`order:${ip}`, 8)) {
      return res.status(429).json({ ok: false, message: "Too many requests. Please try again later." });
    }

    const body = asRecord(req.body);
    const customer = asRecord(body.customer);
    const fullName = cleanHeaderText(customer.fullName ?? body.customerName, 80);
    const email = cleanText(customer.email ?? body.customerEmail, 254).toLowerCase();
    const phone = cleanText(customer.phone ?? body.customerPhone, 30);

    if (!fullName) {
      return res.status(400).json({ ok: false, message: "Name is required." });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ ok: false, message: "Valid email is required." });
    }
    if (!/^[0-9+\-()\s]{7,30}$/.test(phone)) {
      return res.status(400).json({ ok: false, message: "Valid phone number is required." });
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length < 1 || rawItems.length > MAX_ORDER_ITEMS) {
      return res.status(400).json({ ok: false, message: "Cart must contain 1 to 25 items." });
    }

    const items = await Promise.all(rawItems.map(normalizeOrderItem));
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    if (subtotal <= 0 || totalItems <= 0) {
      return res.status(400).json({ ok: false, message: "Cart total is invalid." });
    }

    const orderRef = db.collection("orders").doc();
    const displayId = getDisplayOrderId(orderRef.id);

    await orderRef.set({
      items,
      subtotal,
      totalItems,
      displayId,
      customer: {
        fullName,
        email,
        phone,
      },
      status: "pending_payment",
      source: "website",
      userAgent: cleanText(req.get("user-agent"), 200),
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      ok: true,
      orderId: orderRef.id,
      displayId,
      subtotal,
      totalItems,
    });
  } catch (err) {
    return handleApiError(err, res, "order create error");
  }
});

// ---- Deprecated: order emails are sent by the Firestore trigger only. ----
app.post("/api/order/confirm", async (req, res) => {
  return res.status(410).json({ ok: false, message: "Order confirmation endpoint has moved." });
});

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  handleApiError(err, res, "api middleware error");
});

// Export a single HTTPS function
export const api = onRequest(
  {
    region: "us-central1",
    secrets: ["RESEND_API_KEY", "EMAIL_FROM", "STUDIO_EMAIL"],
  },
  app
);

// ---- Firestore trigger: send emails automatically when order is created ----
export const onOrderCreated = onDocumentCreated(
  {
    document: "orders/{orderId}",
    region: "us-central1",
    secrets: ["RESEND_API_KEY", "EMAIL_FROM", "STUDIO_EMAIL"],
  },
  async (event) => {
    const rawOrderId = String(event.params.orderId);
    const data = event.data?.data();

    if (!data) return;

    const orderId = cleanHeaderText(data.displayId, 20) || getDisplayOrderId(rawOrderId);
    const customerEmail = data.customer?.email;
    const customerName = data.customer?.fullName || "";
    const customerPhone = data.customer?.phone || "";

    const items = Array.isArray(data.items) ? data.items : [];
    const itemLines = formatOrderItems(items);
    const subtotal = typeof data.subtotal === "number" ? data.subtotal : null;

    const resend = getResendClient();
    const EMAIL_FROM = getEnvOrThrow("EMAIL_FROM");
    const STUDIO_EMAIL = getEnvOrThrow("STUDIO_EMAIL");

    // Studio email always (unless you want to guard)
    await resend.emails.send({
      from: EMAIL_FROM,
      to: STUDIO_EMAIL,
      subject: `New order: ${orderId}`,
      text:
`A new order was placed.

Order ID: ${orderId}
Customer: ${customerName} <${customerEmail || "no email"}>
Phone: ${customerPhone || "(not provided)"}

Items:
${itemLines || "- (no items found)"}

Subtotal:
${subtotal === null ? "Price not set" : formatCurrency(subtotal)}

Notes:
${data.notes || "(none)"}
`,
    });

    // Customer email if available
    if (customerEmail && isValidEmail(String(customerEmail))) {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: String(customerEmail),
        subject: "We received your order — ATELIER 2901",
        text:
`Hi ${customerName || "there"},

We've received your order (ID: ${orderId}).
Our team will reach out shortly to confirm details.

Items:
${itemLines || "- (no items found)"}

Subtotal:
${subtotal === null ? "Price not set" : formatCurrency(subtotal)}

Thank you,
ATELIER 2901
`,
      });
    }
  }
);
