// import * as functions from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import express from "express";
import cors from "cors";
import { Resend } from "resend";

initializeApp();
const db = getFirestore();

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
app.use(express.json());

// If your frontend calls same domain, CORS is not needed, but safe to allow your site:
app.use(cors({
  origin: true, // or ["https://atelier2901.com", "http://localhost:5173"]
}));

// ---- Simple in-memory rate limit (per IP) ----
const RATE_WINDOW_MS = 5 * 60 * 1000; // 5 min
const RATE_MAX = 20;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count += 1;
  return true;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---- POST /api/contact ----
app.post("/api/contact", async (req, res) => {
  try {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
      || req.socket.remoteAddress
      || "unknown";

    if (!rateLimit(ip)) {
      return res.status(429).json({ ok: false, message: "Too many requests. Please try again later." });
    }

    const { name, email, message, source, companyWebsite, phone } = req.body || {};

    // Honeypot: silently succeed to not tip off bots
    if (companyWebsite && String(companyWebsite).trim().length > 0) {
      return res.status(200).json({ ok: true });
    }

    if (!name || String(name).trim().length < 1) {
      return res.status(400).json({ ok: false, message: "Name is required." });
    }
    if (!email || !isValidEmail(String(email))) {
      return res.status(400).json({ ok: false, message: "Valid email is required." });
    }
    if (!message || String(message).trim().length < 10) {
      return res.status(400).json({ ok: false, message: "Message must be at least 10 characters." });
    }

    const safeSource = source ? String(source) : "unknown";
    const safePhone = phone ? String(phone).trim() : "";

    const resend = getResendClient();
    const EMAIL_FROM = getEnvOrThrow("EMAIL_FROM");
    const STUDIO_EMAIL = getEnvOrThrow("STUDIO_EMAIL");

    await resend.emails.send({
      from: EMAIL_FROM,
      to: STUDIO_EMAIL,
      replyTo: String(email),
      subject: `New message from ${String(name).trim()}`,
      text:
`Source: ${safeSource}

Name: ${String(name).trim()}
Email: ${String(email).trim()}

Message:
${String(message).trim()}

Phone:
${safePhone || "(not provided)"}
`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("contact error", err);
    return res.status(500).json({ ok: false, message: "Server error while sending message." });
  }
});

// ---- POST /api/order/confirm (optional) ----
// Frontend can call this after creating order doc.
// Backend reads order from Firestore and emails studio + customer.
app.post("/api/order/confirm", async (req, res) => {
  try {
    const { orderId, customerEmail, customerName, customerPhone } = req.body || {};

    if (!orderId || String(orderId).trim().length < 5) {
      return res.status(400).json({ ok: false, message: "orderId is required." });
    }
    if (!customerEmail || !isValidEmail(String(customerEmail))) {
      return res.status(400).json({ ok: false, message: "Valid customerEmail is required." });
    }

    // Fetch order
    const snap = await db.collection("orders").doc(String(orderId)).get();
    if (!snap.exists) {
      return res.status(404).json({ ok: false, message: "Order not found." });
    }
    const order = snap.data();
    const orderPhone = order?.customer?.phone || customerPhone || "";

    // Compose minimal summary
    const items = Array.isArray(order?.items) ? order.items : [];
    const itemLines = items.map((it: any) => {
      const nm = it?.name || "ATELIER 2901";
      const qty = it?.quantity || 1;
      return `- ${nm} x${qty}`;
    }).join("\n");

    const resend = getResendClient();
    const EMAIL_FROM = getEnvOrThrow("EMAIL_FROM");
    const STUDIO_EMAIL = getEnvOrThrow("STUDIO_EMAIL");

    // Studio email
    await resend.emails.send({
      from: EMAIL_FROM,
      to: STUDIO_EMAIL,
      subject: `New order: ${orderId}`,
      text:
`A new order was placed.

Order ID: ${orderId}
Customer: ${customerName || ""} <${customerEmail}>
Phone: ${orderPhone || "(not provided)"}

Items:
${itemLines || "- (no items found)"}

Notes:
${order?.notes || "(none)"}
`,
    });

    // Customer email
    await resend.emails.send({
      from: EMAIL_FROM,
      to: String(customerEmail),
      subject: "We received your order — ATELIER 2901",
      text:
`Hi ${customerName || "there"},

We've received your order (ID: ${orderId}).
Our team will reach out shortly to confirm details.
Phone: ${orderPhone || "(not provided)"}

Items:
${itemLines || "- (no items found)"}

Thank you,
ATELIER 2901
`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("order/confirm error", err);
    return res.status(500).json({ ok: false, message: "Server error while sending order emails." });
  }
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
    const orderId = event.params.orderId;
    const data = event.data?.data();

    if (!data) return;

    const customerEmail = data.customer?.email;
    const customerName = data.customer?.fullName || "";
    const customerPhone = data.customer?.phone || "";

    // Guard: if no email on the order, don’t send customer email
    const items = Array.isArray(data.items) ? data.items : [];
    const itemLines = items.map((it: any) => {
      const nm = it?.name || "ATELIER 2901";
      const qty = it?.quantity || 1;
      return `- ${nm} x${qty}`;
    }).join("\n");

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
Phone: ${customerPhone || "(not provided)"}

Items:
${itemLines || "- (no items found)"}

Thank you,
ATELIER 2901
`,
      });
    }
  }
);
