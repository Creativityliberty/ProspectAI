
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import fetch from "node-fetch";
import { trackingRoutes } from "./tracking.js";
import { inboundEmailRoute } from "./inbound.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);

// P7: Tracking Routes
trackingRoutes(app);

// P8: Inbound Routes
inboundEmailRoute(app);

const DRY_RUN = String(process.env.DRY_RUN || "true") === "true";

// Simple in-memory rate limiter
const rate = { windowStart: Date.now(), count: 0 };
const MAX_PER_HOUR = 60; // P7: Warmup Limit

function rateLimit(req, res, next) {
  const now = Date.now();
  if (now - rate.windowStart > 3600_000) {
    rate.windowStart = now;
    rate.count = 0;
  }
  rate.count += 1;
  if (rate.count > MAX_PER_HOUR) return res.status(429).json({ ok: false, error: "Rate limit exceeded (Warmup)" });
  next();
}

app.use("/send", rateLimit);

function requireFields(obj, fields) {
  for (const f of fields) {
    if (!obj?.[f]) return `Missing field: ${f}`;
  }
  return null;
}

// --- SMTP transporter ---
const smtpTransport =
  process.env.SMTP_HOST && process.env.SMTP_USER
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null;

// --- Email endpoint ---
app.post("/send/email", async (req, res) => {
  const err = requireFields(req.body, ["to", "subject"]);
  if (err) return res.status(400).json({ ok: false, error: err });

  // P7: Support HTML body for tracking
  const { to, subject, body, html } = req.body;
  const from = process.env.SMTP_FROM || "hello@example.com";

  if (DRY_RUN) {
    console.log(`[DRY RUN] Email to ${to}: ${subject}`);
    if (html) console.log(`[DRY RUN HTML Preview]: ${html.substring(0, 100)}...`);
    return res.json({ ok: true, dryRun: true, provider: "smtp", providerMessageId: "dry_run" });
  }

  if (!smtpTransport) return res.status(500).json({ ok: false, error: "SMTP not configured" });

  try {
    const info = await smtpTransport.sendMail({
      from,
      to,
      subject,
      text: body, // Fallback plain text
      html: html || body.replace(/\n/g, '<br/>'), // Use HTML if provided, else auto-convert
    });

    return res.json({ ok: true, provider: "smtp", providerMessageId: info.messageId || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// --- WhatsApp Cloud API endpoint ---
app.post("/send/whatsapp", async (req, res) => {
  const err = requireFields(req.body, ["toE164", "body"]);
  if (err) return res.status(400).json({ ok: false, error: err });

  const { toE164, body } = req.body;

  if (DRY_RUN) {
    console.log(`[DRY RUN] WhatsApp to ${toE164}: ${body}`);
    return res.json({ ok: true, dryRun: true, provider: "whatsapp", providerMessageId: "dry_run" });
  }

  const token = process.env.WA_TOKEN;
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return res.status(500).json({ ok: false, error: "WhatsApp not configured" });

  try {
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: toE164.replace("+", ""),
      type: "text",
      text: { body },
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    if (!r.ok) return res.status(500).json({ ok: false, error: data });

    const providerMessageId = data?.messages?.[0]?.id || null;
    return res.json({ ok: true, provider: "whatsapp", providerMessageId });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.listen(Number(process.env.PORT || 8787), () => {
  console.log(`Sender server running on :${process.env.PORT || 8787} (dry_run=${DRY_RUN})`);
});
