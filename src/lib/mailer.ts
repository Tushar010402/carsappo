import "server-only";
import crypto from "node:crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import nodemailer from "nodemailer";
import { absoluteUrl } from "@/lib/utils";
import { getSettings } from "@/lib/settings";

/** Placeholder for the store name in subjects and templates; filled from Admin → Settings when the email is sent. */
export const BRAND = "%%brand%%";
import { formatINR } from "@/lib/format";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
  }
  return transporter;
}

/** Development/test: also write every email as JSON into MAIL_OUTBOX_DIR so it can be inspected. */
async function writeToOutbox(args: { to: string; subject: string; html: string }) {
  const dir = process.env.MAIL_OUTBOX_DIR;
  if (!dir) return;
  try {
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${Date.now()}-${crypto.randomUUID()}.json`);
    await writeFile(file, JSON.stringify({ ...args, sentAt: new Date().toISOString() }));
  } catch (err) {
    console.error("[mail] could not write outbox", err);
  }
}

/** Fills the store name, tagline and contact details (Admin → Settings) into the shared email layout. */
async function brand(args: { subject: string; html: string }) {
  const { store } = await getSettings();
  const contact = [store.email, store.phone].filter(Boolean).map(escapeHtml).join(" · ");
  const fill = (s: string, html: boolean) =>
    s
      .replaceAll(BRAND, html ? escapeHtml(store.name) : store.name)
      .replaceAll("%%tagline%%", escapeHtml(store.tagline))
      .replaceAll("%%contact%%", contact);
  return { subject: fill(args.subject, false), html: fill(args.html, true) };
}

export async function sendMail(input: { to: string; subject: string; html: string; replyTo?: string }) {
  const args = { ...input, ...(await brand(input)) };
  await writeToOutbox(args);
  const t = getTransporter();
  if (!t) {
    console.info(`[mail] SMTP not configured — would send "${args.subject}" to ${args.to}`);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || "Carsappo <no-reply@carsappo.com>",
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
    });
  } catch (err) {
    console.error("[mail] failed to send", args.subject, err);
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function emailLayout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;color:#0a0a0a">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
    <tr><td style="background:#0a0a0a;padding:20px 28px"><span style="font:700 20px Poppins,Arial,sans-serif;color:#FFC800;letter-spacing:1px;text-transform:uppercase">${BRAND}</span></td></tr>
    <tr><td style="padding:28px">
      <h1 style="font:600 20px Poppins,Arial,sans-serif;margin:0 0 16px">${escapeHtml(title)}</h1>
      ${body}
    </td></tr>
    <tr><td style="padding:20px 28px;background:#fafafa;color:#71717a;font-size:12px">${BRAND} · %%tagline%%<br/>%%contact%%<br/><a href="${absoluteUrl("/")}" style="color:#71717a">${new URL(absoluteUrl("/")).host}</a></td></tr>
  </table></td></tr></table></body></html>`;
}

export function orderConfirmationEmail(order: {
  orderNumber: string;
  accessToken: string;
  shipName: string;
  total: number;
  paymentMethod: string;
  items: { name: string; quantity: number; price: number }[];
}) {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${escapeHtml(i.name)} × ${i.quantity}</td><td align="right">${formatINR(i.price * i.quantity)}</td></tr>`,
    )
    .join("");
  const link = absoluteUrl(`/order/${order.orderNumber}?t=${order.accessToken}`);
  return emailLayout(
    `Thank you, ${order.shipName.split(" ")[0]}! Your order is confirmed.`,
    `<p style="margin:0 0 16px">Order <b>${order.orderNumber}</b> · ${order.paymentMethod === "COD" ? "Cash on delivery" : "Paid online"}</p>
     <table width="100%" style="font-size:14px;border-top:1px solid #eee;border-bottom:1px solid #eee;margin-bottom:16px">${rows}
     <tr><td style="padding:8px 0;font-weight:600">Total</td><td align="right" style="font-weight:600">${formatINR(order.total)}</td></tr></table>
     <a href="${link}" style="display:inline-block;background:#FFC800;color:#0a0a0a;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">View order &amp; invoice</a>`,
  );
}

export function statusUpdateEmail(order: { orderNumber: string; accessToken: string }, headline: string, detail: string) {
  const link = absoluteUrl(`/order/${order.orderNumber}?t=${order.accessToken}`);
  return emailLayout(
    headline,
    `<p style="margin:0 0 16px">${escapeHtml(detail)}</p>
     <a href="${link}" style="display:inline-block;background:#FFC800;color:#0a0a0a;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Track order ${order.orderNumber}</a>`,
  );
}

export function simpleEmail(title: string, paragraphs: string[], cta?: { label: string; href: string }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 12px">${escapeHtml(p)}</p>`).join("");
  const button = cta
    ? `<a href="${cta.href}" style="display:inline-block;margin-top:8px;background:#FFC800;color:#0a0a0a;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">${escapeHtml(cta.label)}</a>`
    : "";
  return emailLayout(title, body + button);
}

export function adminEmail() {
  return process.env.ADMIN_NOTIFY_EMAIL || null;
}
