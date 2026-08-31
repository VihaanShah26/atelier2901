// import * as functions from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { Resend } from "resend";
import { randomUUID, timingSafeEqual } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { deflateSync, inflateSync } from "zlib";

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
const CATALOG_ID_PATTERN = /^[a-zA-Z0-9._-]{1,80}$/;
const CATALOG_FIELD_PATTERN = /^[a-zA-Z0-9._-]{1,80}$/;

const CATALOG_COLLECTIONS = new Set<string>([
  "stationery_essential",
  "stationery_premium",
  "stationery_money",
  "stationery_hampers",
  "gifting_travel",
  "gifting_coasters",
  "gifting_wine",
  "coffeetablebooks",
  "invitations",
  "hampers",
]);

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

app.use(express.json({ limit: "8mb", type: "application/json" }));

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

type Rgb = [number, number, number];

type ParsedPng = {
  width: number;
  height: number;
  rgb: Buffer;
  alpha: Buffer | null;
};

type PdfImage = {
  width: number;
  height: number;
  rgb: Buffer;
  alpha: Buffer | null;
};

type PdfPage = {
  content: string[];
};

type InvoiceItem = {
  name: string;
  quantity: number;
  unitPrice: number | null;
  lineTotal: number | null;
  details: string[];
};

type CustomerAddress = {
  streetAddress1: string;
  streetAddress2: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
};

type InvoiceData = {
  orderId: string;
  customerName: string;
  customerAddress: CustomerAddress | null;
  customerAddressText: string;
  customerEmail: string;
  customerPhone: string;
  items: InvoiceItem[];
  productSubtotal: number | null;
  shippingCost: number | null;
  subtotal: number | null;
  date: Date;
};

const PDF_WIDTH = 597.863;
const PDF_HEIGHT = 844.463;
const BRAND_GREEN: Rgb = [184, 216, 0];
const BLACK: Rgb = [0, 0, 0];
const INVOICE_LOGO = loadPngImage(join(__dirname, "../assets/logo-black.png"), true);

function loadPngImage(path: string, turnGreenPixelsWhite = false): PdfImage {
  const parsed = parsePng(readFileSync(path));
  if (turnGreenPixelsWhite) {
    replaceLogoGreenWithWhite(parsed.rgb);
  }
  return {
    width: parsed.width,
    height: parsed.height,
    rgb: deflateSync(parsed.rgb),
    alpha: parsed.alpha ? deflateSync(parsed.alpha) : null,
  };
}

function replaceLogoGreenWithWhite(rgb: Buffer) {
  for (let index = 0; index < rgb.length; index += 3) {
    const red = rgb[index];
    const green = rgb[index + 1];
    const blue = rgb[index + 2];
    if (green > 120 && red > 80 && blue < 80) {
      rgb[index] = 255;
      rgb[index + 1] = 255;
      rgb[index + 2] = 255;
    }
  }
}

function parsePng(buffer: Buffer): ParsedPng {
  const signature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error("Logo image must be a PNG file.");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks: Buffer[] = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }

    offset += length + 12;
  }

  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error("Logo PNG must use 8-bit RGB or RGBA color.");
  }

  const channels = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idatChunks));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * channels);
  let sourceOffset = 0;
  let targetOffset = 0;
  let previous = Buffer.alloc(stride);

  for (let row = 0; row < height; row += 1) {
    const filter = raw[sourceOffset];
    sourceOffset += 1;
    const scanline = Buffer.from(raw.subarray(sourceOffset, sourceOffset + stride));
    sourceOffset += stride;

    for (let i = 0; i < stride; i += 1) {
      const left = i >= channels ? scanline[i - channels] : 0;
      const up = previous[i] || 0;
      const upperLeft = i >= channels ? previous[i - channels] || 0 : 0;

      if (filter === 1) {
        scanline[i] = (scanline[i] + left) & 255;
      } else if (filter === 2) {
        scanline[i] = (scanline[i] + up) & 255;
      } else if (filter === 3) {
        scanline[i] = (scanline[i] + Math.floor((left + up) / 2)) & 255;
      } else if (filter === 4) {
        scanline[i] = (scanline[i] + paethPredictor(left, up, upperLeft)) & 255;
      } else if (filter !== 0) {
        throw new Error("Unsupported PNG filter.");
      }
    }

    scanline.copy(pixels, targetOffset);
    targetOffset += stride;
    previous = scanline;
  }

  const rgb = Buffer.alloc(width * height * 3);
  const alpha = colorType === 6 ? Buffer.alloc(width * height) : null;

  for (let source = 0, rgbTarget = 0, alphaTarget = 0; source < pixels.length; source += channels) {
    rgb[rgbTarget] = pixels[source];
    rgb[rgbTarget + 1] = pixels[source + 1];
    rgb[rgbTarget + 2] = pixels[source + 2];
    rgbTarget += 3;
    if (alpha) {
      alpha[alphaTarget] = pixels[source + 3];
      alphaTarget += 1;
    }
  }

  return {
    width,
    height,
    rgb,
    alpha: alpha && alpha.some((value) => value < 255) ? alpha : null,
  };
}

function paethPredictor(left: number, up: number, upperLeft: number) {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  if (upDistance <= upperLeftDistance) return up;
  return upperLeft;
}

function pdfColor(color: Rgb) {
  return color.map((value) => (value / 255).toFixed(4)).join(" ");
}

function pdfString(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\r\n]+/g, " ");
}

function htmlEscape(value: unknown, maxLength = 500) {
  return cleanText(value, maxLength)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function drawRect(page: PdfPage, x: number, y: number, width: number, height: number, fill: Rgb) {
  page.content.push(`${pdfColor(fill)} rg ${x} ${y} ${width} ${height} re f\n`);
}

function drawText(page: PdfPage, text: string, x: number, y: number, size: number, color: Rgb = BLACK) {
  page.content.push(`BT ${pdfColor(color)} rg /F1 ${size} Tf ${x} ${y} Td (${pdfString(text)}) Tj ET\n`);
}

function drawImage(page: PdfPage, x: number, y: number, width: number, height: number) {
  page.content.push(`q ${width} 0 0 ${height} ${x} ${y} cm /Logo Do Q\n`);
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length > maxChars && line) {
      lines.push(line);
      line = word;
      return;
    }
    line = nextLine;
  });

  if (line) lines.push(line);
  return lines.length > 0 ? lines : [""];
}

function normalizeCustomerAddress(value: unknown): CustomerAddress {
  const address = asRecord(value);
  return {
    streetAddress1: cleanText(address.streetAddress1, 100),
    streetAddress2: cleanText(address.streetAddress2, 100),
    city: cleanText(address.city, 80),
    state: cleanText(address.state, 80),
    country: cleanText(address.country, 80),
    zipCode: cleanText(address.zipCode, 20),
  };
}

function formatCustomerAddress(address: CustomerAddress | null, fallback: unknown = "") {
  if (!address) {
    return cleanText(fallback, 240);
  }

  const street = [address.streetAddress1, address.streetAddress2]
    .filter(Boolean)
    .join(", ");
  const cityLine = [address.city, address.state, address.zipCode]
    .filter(Boolean)
    .join(", ");
  return [street, cityLine, address.country]
    .filter(Boolean)
    .join(", ");
}

function calculateShippingCost(city: unknown) {
  return cleanText(city, 80).toLowerCase() === "mumbai" ? 150 : 250;
}

function getStoredCustomerAddress(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return normalizeCustomerAddress(value);
}

function cleanPhoneCountryCode(value: unknown) {
  const countryCode = cleanText(value, 8);
  if (!/^\+[0-9]{1,4}(?:-[0-9]{1,4})?$/.test(countryCode)) {
    throw new ApiError(400, "Valid phone country code is required.");
  }
  return countryCode;
}

function formatStudioProductNames(items: unknown[]) {
  return items.map((rawItem, index) => {
    const item = asRecord(rawItem);
    const name = cleanText(item.name, 120) || "ATELIER 2901";
    return `${index + 1}. ${name}`;
  }).join("\n");
}

function formatStudioProductHtml(params: {
  items: unknown[];
  orderId: string;
  customerName: unknown;
  customerEmail: unknown;
  customerPhone: unknown;
  productSubtotalText: string;
  shippingText: string;
  subtotalText: string;
  notes: unknown;
}) {
  const rows = params.items.map((rawItem) => {
    const item = asRecord(rawItem);
    const name = htmlEscape(item.name || "ATELIER 2901");
    const imageUrl = cleanText(item.img, 1000);
    const imageCell = imageUrl ?
      `<img src="${htmlEscape(imageUrl, 1000)}" alt="" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:cover;border:1px solid #e5e5e5;" />` :
      `<div style="width:56px;height:56px;border:1px solid #e5e5e5;background:#f7f7f7;"></div>`;

    return `<tr>
  <td style="width:68px;padding:8px 12px 8px 0;vertical-align:middle;">${imageCell}</td>
  <td style="padding:8px 0;vertical-align:middle;font:14px Arial, Helvetica, sans-serif;color:#111111;">${name}</td>
</tr>`;
  }).join("");

  return `<div style="font:14px Arial, Helvetica, sans-serif;color:#111111;line-height:1.5;">
  <p>A new order was placed.</p>
  <p>
    <strong>Order ID:</strong> ${htmlEscape(params.orderId)}<br />
    <strong>Customer:</strong> ${htmlEscape(params.customerName)} &lt;${htmlEscape(params.customerEmail || "no email")}&gt;<br />
    <strong>Phone:</strong> ${htmlEscape(params.customerPhone || "(not provided)")}
  </p>
  <p><strong>Products:</strong></p>
  <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 16px 0;">
    ${rows || `<tr><td style="font:14px Arial, Helvetica, sans-serif;color:#111111;">No products found.</td></tr>`}
  </table>
  <p>
    <strong>Products:</strong> ${htmlEscape(params.productSubtotalText)}<br />
    <strong>Shipping:</strong>  ${htmlEscape(params.shippingText)}<br />
    <strong>Subtotal:</strong><br />
    ${htmlEscape(params.subtotalText)}
  </p>
  <p>The itemized invoice is attached as a PDF.</p>
  <p>
    <strong>Notes:</strong><br />
    ${htmlEscape(params.notes || "(none)")}
  </p>
</div>`;
}

function normalizeInvoiceItems(items: unknown[]): InvoiceItem[] {
  return items.map((rawItem) => {
    const item = asRecord(rawItem);
    const quantity = parsePositiveInteger(item.quantity);
    const unitPrice = typeof item.price === "number" ? item.price : null;
    const lineTotal = typeof item.lineTotal === "number" ?
      item.lineTotal :
      unitPrice === null ? null : unitPrice * quantity;
    const details: string[] = [];

    if (typeof item.size === "string" && item.size.trim()) {
      details.push(`Size: ${item.size.trim()}`);
    }
    if (item.goldFoil === "yes" || item.goldFoil === "no") {
      details.push(`Gold foil: ${item.goldFoil === "yes" ? "Yes" : "No"}`);
    }
    if (item.personalize === "yes" || item.personalize === "no") {
      details.push(`Personalized: ${item.personalize === "yes" ? "Yes" : "No"}`);
    }
    if (typeof item.greeting === "string" && item.greeting.trim()) {
      details.push(`Greeting: ${item.greeting.trim()}`);
    }
    if (typeof item.personalizationName === "string" && item.personalizationName.trim()) {
      details.push(`Name: ${item.personalizationName.trim()}`);
    }
    if (Array.isArray(item.personalizationDetails) && item.personalizationDetails.length > 0) {
      item.personalizationDetails.forEach((rawDetail: unknown, detailIndex: number) => {
        const detail = asRecord(rawDetail);
        const set = Number(detail.set) || detailIndex + 1;
        const greeting = typeof detail.greeting === "string" && detail.greeting.trim() ?
          detail.greeting.trim() :
          "None";
        const name = typeof detail.name === "string" && detail.name.trim() ?
          detail.name.trim() :
          "None";
        details.push(`Set ${set}: Greeting ${greeting}; Name ${name}`);
      });
    }
    if (typeof item.initials === "string" && item.initials.trim()) {
      details.push(`Initials: ${item.initials.trim()}`);
    }

    return {
      name: cleanText(item.name, 120) || "ATELIER 2901",
      quantity,
      unitPrice,
      lineTotal,
      details,
    };
  });
}

function getOrderDate(value: unknown) {
  const timestamp = asRecord(value);
  const toDate = timestamp.toDate;
  if (typeof toDate === "function") {
    return toDate.call(value) as Date;
  }
  return new Date();
}

function formatInvoiceDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function addInvoiceScaffold(page: PdfPage, invoice: InvoiceData, pageNumber: number) {
  drawRect(page, 230, PDF_HEIGHT - 115, 138, 115, BRAND_GREEN);
  drawImage(page, 242, PDF_HEIGHT - 75, 114, 15.4);

  if (pageNumber === 1) {
    const address = invoice.customerAddressText || invoice.customerEmail || "";
    const addressLines = wrapText(address, 52).slice(0, 3);
    drawText(page, `Client Name : ${invoice.customerName || ""}`, 39, 704, 12);
    drawText(page, `Address : ${addressLines[0] || ""}`, 39, 684, 12);
    if (addressLines[1]) {
      drawText(page, addressLines[1], 83, 666, 10);
    }
    if (addressLines[2]) {
      drawText(page, addressLines[2], 83, 650, 10);
    }
    drawText(page, invoice.customerPhone ? `Phone : ${invoice.customerPhone}` : "", 39, addressLines[2] ? 632 : addressLines[1] ? 646 : 664, 12);
    drawText(page, `Date : ${formatInvoiceDate(invoice.date)}`, 418, 704, 12);
    drawText(page, `Order ID : ${invoice.orderId}`, 418, 684, 12);
  } else {
    drawText(page, `Order ID : ${invoice.orderId}`, 39, 704, 12);
    drawText(page, `Page ${pageNumber}`, 500, 704, 12);
  }

  drawRect(page, 39, 596, 519, 25, BRAND_GREEN);
  drawText(page, "Design Particulars", 86, 606, 11);
  drawText(page, "Qty", 266, 606, 11);
  drawText(page, "Rate", 349, 606, 11);
  drawText(page, "Price", 482, 606, 11);
  drawFooter(page);
}

function drawFooter(page: PdfPage) {
  drawText(page, "Ph : +91 9820734434", 38, 39, 9);
  drawText(page, "E-mail : orders@atelier2901.com", 136, 39, 9);
  drawText(page, "@Atelier_2901", 280, 39, 9);
  drawText(page, "For ATELIER 2901", 462, 104, 11);
  drawText(page, "Payal Shah", 476, 70, 11);
  drawText(page, "Authorised Signatory", 455, 39, 11);
}

function addTotal(page: PdfPage, invoice: InvoiceData) {
  drawText(page, "Products", 410, 196, 10);
  drawText(page, invoice.productSubtotal === null ? "Price not set" : formatCurrency(invoice.productSubtotal), 475, 196, 10);
  drawText(page, "Shipping", 410, 176, 10);
  drawText(page, invoice.shippingCost === null ? "Price not set" : formatCurrency(invoice.shippingCost), 475, 176, 10);
  drawRect(page, 39, 124, 519, 35, BRAND_GREEN);
  drawText(page, "Subtotal", 56, 139, 12);
  drawText(page, invoice.subtotal === null ? "Price not set" : formatCurrency(invoice.subtotal), 475, 139, 12);
}

function addInvoiceItem(page: PdfPage, item: InvoiceItem, y: number) {
  const nameLines = wrapText(item.name, 42);
  const detailLines = item.details.flatMap((detail) => wrapText(detail, 48));
  const allLines = [...nameLines, ...detailLines];

  allLines.forEach((line, index) => {
    const size = index < nameLines.length ? 10 : 8;
    drawText(page, line, 55, y - index * 11, size);
  });

  drawText(page, String(item.quantity), 271, y, 10);
  drawText(page, item.unitPrice === null ? "Price not set" : formatCurrency(item.unitPrice), 331, y, 10);
  drawText(page, item.lineTotal === null ? "Price not set" : formatCurrency(item.lineTotal), 466, y, 10);
}

function getInvoiceRowHeight(item: InvoiceItem) {
  const lines = wrapText(item.name, 42).length +
    item.details.flatMap((detail) => wrapText(detail, 48)).length;
  return Math.max(28, lines * 11 + 10);
}

function buildInvoicePdf(invoice: InvoiceData): Buffer {
  const pages: PdfPage[] = [];
  let pageNumber = 1;
  let page: PdfPage = { content: [] };
  let cursorY = 566;

  addInvoiceScaffold(page, invoice, pageNumber);

  invoice.items.forEach((item) => {
    const rowHeight = getInvoiceRowHeight(item);
    if (cursorY - rowHeight < 178) {
      pages.push(page);
      pageNumber += 1;
      page = { content: [] };
      cursorY = 566;
      addInvoiceScaffold(page, invoice, pageNumber);
    }

    addInvoiceItem(page, item, cursorY);
    cursorY -= rowHeight;
  });

  addTotal(page, invoice);
  pages.push(page);

  return serializePdf(pages);
}

function serializePdf(pages: PdfPage[]) {
  const objects: Buffer[] = [];
  const addObject = (body: string | Buffer) => {
    objects.push(Buffer.isBuffer(body) ? body : Buffer.from(body, "binary"));
    return objects.length;
  };

  addObject("<< /Type /Catalog /Pages 2 0 R >>");
  addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  let imageId = 0;
  let alphaId = 0;

  if (INVOICE_LOGO.alpha) {
    alphaId = addObject(streamObject(
      `<< /Type /XObject /Subtype /Image /Width ${INVOICE_LOGO.width} /Height ${INVOICE_LOGO.height} ` +
      "/ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode",
      INVOICE_LOGO.alpha
    ));
  }

  imageId = addObject(streamObject(
    `<< /Type /XObject /Subtype /Image /Width ${INVOICE_LOGO.width} /Height ${INVOICE_LOGO.height} ` +
    `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode${alphaId ? ` /SMask ${alphaId} 0 R` : ""}`,
    INVOICE_LOGO.rgb
  ));

  const pageIds: number[] = [];
  pages.forEach((page) => {
    const content = Buffer.from(page.content.join(""), "binary");
    const contentId = addObject(streamObject("<<", content));
    const pageId = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontId} 0 R >> /XObject << /Logo ${imageId} 0 R >> >> ` +
      `/Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  objects[1] = Buffer.from(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`,
    "binary"
  );

  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary")];
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(Buffer.concat(chunks).length);
    chunks.push(Buffer.from(`${index + 1} 0 obj\n`, "binary"));
    chunks.push(body);
    chunks.push(Buffer.from("\nendobj\n", "binary"));
  });

  const xrefOffset = Buffer.concat(chunks).length;
  chunks.push(Buffer.from(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`, "binary"));
  offsets.slice(1).forEach((offset) => {
    chunks.push(Buffer.from(`${String(offset).padStart(10, "0")} 00000 n \n`, "binary"));
  });
  chunks.push(Buffer.from(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
    "binary"
  ));

  return Buffer.concat(chunks);
}

function streamObject(dictionaryStart: string, content: Buffer) {
  return Buffer.concat([
    Buffer.from(`${dictionaryStart} /Length ${content.length} >>\nstream\n`, "binary"),
    content,
    Buffer.from("\nendstream", "binary"),
  ]);
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

function validateAdminPassword(value: unknown) {
  const expected = getEnvOrThrow("ADMIN_PAGE_PASSWORD");
  if (typeof value !== "string" || !value) return false;

  const submittedBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  if (submittedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(submittedBuffer, expectedBuffer);
}

function requireAdmin(req: Request) {
  if (!validateAdminPassword(asRecord(req.body).password)) {
    throw new ApiError(401, "Invalid admin password.");
  }
}

function assertCatalogCollection(value: unknown) {
  if (typeof value !== "string" || !CATALOG_COLLECTIONS.has(value)) {
    throw new ApiError(400, "Invalid catalog collection.");
  }
  return value;
}

function assertCatalogItemId(value: unknown) {
  if (typeof value !== "string" || !CATALOG_ID_PATTERN.test(value)) {
    throw new ApiError(400, "Invalid product id.");
  }
  return value;
}

function sanitizeCatalogValue(value: unknown, depth = 0): unknown {
  if (depth > 5) throw new ApiError(400, "Catalog data is too deeply nested.");
  if (value === null || typeof value === "boolean") return value;

  if (typeof value === "string") {
    return cleanText(value, 5000);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > 100) throw new ApiError(400, "Catalog array is too large.");
    return value.map((entry) => sanitizeCatalogValue(entry, depth + 1));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (!CATALOG_FIELD_PATTERN.test(key)) continue;
      out[key] = sanitizeCatalogValue(nestedValue, depth + 1);
    }
    return out;
  }
  return null;
}

function sanitizeCatalogPayload(value: unknown) {
  const rawPayload = asRecord(value);
  const payload: Record<string, unknown> = {};

  for (const [key, rawValue] of Object.entries(rawPayload)) {
    if (!CATALOG_FIELD_PATTERN.test(key)) continue;
    payload[key] = sanitizeCatalogValue(rawValue);
  }

  const name = cleanText(payload.name, 200);
  if (!name) throw new ApiError(400, "Product name is required.");
  payload.name = name;

  if ("img" in payload) {
    payload.img = cleanText(payload.img, 5000);
  }
  if ("price" in payload && payload.price !== null && typeof payload.price !== "number") {
    payload.price = Number(payload.price);
  }
  if ("personalizedPrice" in payload &&
      payload.personalizedPrice !== null &&
      typeof payload.personalizedPrice !== "number") {
    payload.personalizedPrice = Number(payload.personalizedPrice);
  }

  payload.updatedAt = FieldValue.serverTimestamp();
  return payload;
}

function getStorageFolder(collectionId: string) {
  if (collectionId.startsWith("stationery")) return "stationery";
  if (collectionId.startsWith("gifting")) return "gifting";
  if (collectionId === "coffeetablebooks") return "coffeetablebooks";
  if (collectionId === "invitations") return "invitations";
  if (collectionId === "hampers") return "hampers";
  return collectionId;
}

function safeUploadName(value: unknown) {
  const fileName = typeof value === "string" ? value : "image";
  return fileName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 120) || "image";
}

function parseDataUrl(value: unknown) {
  if (typeof value !== "string") {
    throw new ApiError(400, "Image is required.");
  }
  const match = value.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) {
    throw new ApiError(400, "Only PNG, JPG, WebP, or GIF uploads are allowed.");
  }
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 6 * 1024 * 1024) {
    throw new ApiError(400, "Image must be under 6 MB.");
  }
  return { contentType: match[1], buffer };
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

// ---- POST /api/admin/verify ----
app.post("/api/admin/verify", async (req, res) => {
  try {
    requireAdmin(req);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return handleApiError(err, res, "admin verify error");
  }
});

// ---- POST /api/admin/catalog/save ----
app.post("/api/admin/catalog/save", async (req, res) => {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`admin-save:${ip}`, 60)) {
      return res.status(429).json({ ok: false, message: "Too many requests. Please try again later." });
    }

    requireAdmin(req);
    const body = asRecord(req.body);
    const collectionId = assertCatalogCollection(body.collectionId);
    const itemId = assertCatalogItemId(body.itemId);
    const payload = sanitizeCatalogPayload(body.data);

    await db.collection(collectionId).doc(itemId).set(payload, { merge: true });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return handleApiError(err, res, "admin catalog save error");
  }
});

// ---- POST /api/admin/catalog/create ----
app.post("/api/admin/catalog/create", async (req, res) => {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`admin-create:${ip}`, 30)) {
      return res.status(429).json({ ok: false, message: "Too many requests. Please try again later." });
    }

    requireAdmin(req);
    const body = asRecord(req.body);
    const collectionId = assertCatalogCollection(body.collectionId);
    const itemId = assertCatalogItemId(body.itemId);
    const payload = sanitizeCatalogPayload(body.data);

    const itemRef = db.collection(collectionId).doc(itemId);
    const existing = await itemRef.get();
    if (existing.exists) {
      throw new ApiError(409, "A product with this id already exists.");
    }

    await itemRef.set({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
    });
    return res.status(201).json({ ok: true, itemId });
  } catch (err) {
    return handleApiError(err, res, "admin catalog create error");
  }
});

// ---- POST /api/admin/catalog/upload ----
app.post("/api/admin/catalog/upload", async (req, res) => {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`admin-upload:${ip}`, 30)) {
      return res.status(429).json({ ok: false, message: "Too many requests. Please try again later." });
    }

    requireAdmin(req);
    const body = asRecord(req.body);
    const collectionId = assertCatalogCollection(body.collectionId);
    const { contentType, buffer } = parseDataUrl(body.dataUrl);
    const folder = getStorageFolder(collectionId);
    const fileName = safeUploadName(body.fileName);
    const path = `${folder}/${Date.now()}-${fileName}`;
    const bucket = getStorage().bucket();
    const file = bucket.file(path);
    const downloadToken = randomUUID();

    await file.save(buffer, {
      contentType,
      metadata: {
        cacheControl: "public, max-age=31536000",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
      resumable: false,
    });

    return res.status(201).json({
      ok: true,
      url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`,
    });
  } catch (err) {
    return handleApiError(err, res, "admin catalog upload error");
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
    const address = normalizeCustomerAddress(customer.address ?? body.customerAddress);
    const email = cleanText(customer.email ?? body.customerEmail, 254).toLowerCase();
    const legacyPhone = cleanText(customer.phone ?? body.customerPhone, 30);
    const legacyCountryCode = legacyPhone.match(/^\+[0-9]{1,4}(?:-[0-9]{1,4})?/)?.[0];
    const phoneCountryCode = cleanPhoneCountryCode(customer.phoneCountryCode ?? body.phoneCountryCode ?? legacyCountryCode ?? "+91");
    const phoneNumber = cleanText(
      customer.phoneNumber ?? body.phoneNumber ?? legacyPhone.replace(/^\+[0-9]{1,4}(?:-[0-9]{1,4})?\s*/, ""),
      24
    );
    const phone = `${phoneCountryCode} ${phoneNumber}`;

    if (!fullName) {
      return res.status(400).json({ ok: false, message: "Name is required." });
    }
    if (!address.streetAddress1) {
      return res.status(400).json({ ok: false, message: "Street address 1 is required." });
    }
    if (!address.city) {
      return res.status(400).json({ ok: false, message: "City is required." });
    }
    if (!address.state) {
      return res.status(400).json({ ok: false, message: "State is required." });
    }
    if (!address.country) {
      return res.status(400).json({ ok: false, message: "Country is required." });
    }
    if (!address.zipCode) {
      return res.status(400).json({ ok: false, message: "Zip code is required." });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ ok: false, message: "Valid email is required." });
    }
    if (!/^[0-9\-()\s]{5,24}$/.test(phoneNumber)) {
      return res.status(400).json({ ok: false, message: "Valid phone number is required." });
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length < 1 || rawItems.length > MAX_ORDER_ITEMS) {
      return res.status(400).json({ ok: false, message: "Cart must contain 1 to 25 items." });
    }

    const items = await Promise.all(rawItems.map(normalizeOrderItem));
    const productSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingCost = calculateShippingCost(address.city);
    const subtotal = productSubtotal + shippingCost;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    if (productSubtotal <= 0 || totalItems <= 0) {
      return res.status(400).json({ ok: false, message: "Cart total is invalid." });
    }

    const orderRef = db.collection("orders").doc();
    const displayId = getDisplayOrderId(orderRef.id);

    await orderRef.set({
      items,
      productSubtotal,
      shippingCost,
      subtotal,
      totalItems,
      displayId,
      customer: {
        fullName,
        address,
        email,
        phoneCountryCode,
        phoneNumber,
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
    secrets: ["RESEND_API_KEY", "EMAIL_FROM", "STUDIO_EMAIL", "ADMIN_PAGE_PASSWORD"],
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
    const rawCustomerAddress = data.customer?.address || "";
    const customerAddress = getStoredCustomerAddress(rawCustomerAddress);
    const customerAddressText = formatCustomerAddress(customerAddress, rawCustomerAddress);
    const customerPhone = data.customer?.phone || "";

    const items = Array.isArray(data.items) ? data.items : [];
    const productSubtotal = typeof data.productSubtotal === "number" ?
      data.productSubtotal :
      items.reduce((sum: number, rawItem: unknown) => {
        const item = asRecord(rawItem);
        return sum + (typeof item.lineTotal === "number" ? item.lineTotal : 0);
      }, 0);
    const shippingCost = typeof data.shippingCost === "number" ?
      data.shippingCost :
      customerAddress ? calculateShippingCost(customerAddress.city) : null;
    const subtotal = typeof data.subtotal === "number" ?
      data.subtotal :
      shippingCost === null ? productSubtotal : productSubtotal + shippingCost;
    const productSubtotalText = productSubtotal === null ? "Price not set" : formatCurrency(productSubtotal);
    const shippingText = shippingCost === null ? "Price not set" : formatCurrency(shippingCost);
    const subtotalText = subtotal === null ? "Price not set" : formatCurrency(subtotal);
    const productNames = formatStudioProductNames(items);
    const invoice = buildInvoicePdf({
      orderId,
      customerName: cleanText(customerName, 80),
      customerAddress,
      customerAddressText,
      customerEmail: cleanText(customerEmail, 254),
      customerPhone: cleanText(customerPhone, 30),
      items: normalizeInvoiceItems(items),
      productSubtotal,
      shippingCost,
      subtotal,
      date: getOrderDate(data.createdAt),
    });
    const invoiceAttachment = {
      filename: `atelier2901-invoice-${orderId}.pdf`,
      content: invoice.toString("base64"),
      contentType: "application/pdf",
    };

    const resend = getResendClient();
    const EMAIL_FROM = getEnvOrThrow("EMAIL_FROM");
    const STUDIO_EMAIL = getEnvOrThrow("STUDIO_EMAIL");

    // Studio email always (unless you want to guard)
    await resend.emails.send({
      from: EMAIL_FROM,
      to: STUDIO_EMAIL,
      subject: `New order: ${orderId}`,
      attachments: [invoiceAttachment],
      html: formatStudioProductHtml({
        items,
        orderId,
        customerName,
        customerEmail,
        customerPhone,
        productSubtotalText,
        shippingText,
        subtotalText,
        notes: data.notes,
      }),
      text:
`A new order was placed.

Order ID: ${orderId}
Customer: ${customerName} <${customerEmail || "no email"}>
Phone: ${customerPhone || "(not provided)"}

Products:
${productNames || "- (no products found)"}

Product subtotal:
${productSubtotalText}

Shipping:
${shippingText}

Subtotal:
${subtotalText}

The itemized invoice is attached as a PDF.

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
        attachments: [invoiceAttachment],
        text:
`Hi ${customerName || "there"},

We've received your order (ID: ${orderId}).
Our team will reach out shortly to confirm details.

Product subtotal:
${productSubtotalText}

Shipping:
${shippingText}

Subtotal:
${subtotalText}

Your itemized invoice is attached as a PDF.

Thank you,
ATELIER 2901
`,
      });
    }
  }
);
