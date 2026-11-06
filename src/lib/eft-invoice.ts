import { createHash } from "node:crypto";
import type { Buyer, OrderItem } from "@/lib/commerce";

export type Invoice = {
  id: string; buyer: Buyer; items: OrderItem[];
  subtotalCents: number; deliveryCents: number; totalCents: number;
  bank: { bankName: string; accountHolder: string; accountNumber: string;
    branchCode: string; accountType: string };
};
const escape = (value: string) => value.replace(/[&<>"']/g, (char) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const cash = (value: number) => "R" + (value / 100).toFixed(2);
export function referenceFor(id: string) {
  return "MA-" + id.replace(/-/g, "").slice(0, 12).toUpperCase();
}
function invoiceTable(invoice: Invoice) {
  const rows = invoice.items.map((item) => `<tr><td style="padding:12px;border-bottom:1px solid #ddd">${escape(item.name)}<br/><small>Size ${escape(item.size)} / Qty ${item.quantity}</small></td><td style="text-align:right;padding:12px;border-bottom:1px solid #ddd">${cash(item.unit_price_cents * item.quantity)}</td></tr>`).join("");
  return `<table style="border-collapse:collapse;width:100%;margin:25px 0;font-size:14px">${rows}<tr><td style="padding:12px">Subtotal</td><td style="padding:12px;text-align:right">${cash(invoice.subtotalCents)}</td></tr><tr><td style="padding:12px">Delivery</td><td style="padding:12px;text-align:right">${cash(invoice.deliveryCents)}</td></tr><tr><th style="padding:14px 12px;border-top:2px solid #151515;text-align:left">TOTAL DUE</th><th style="padding:14px 12px;border-top:2px solid #151515;text-align:right">${cash(invoice.totalCents)}</th></tr></table>`;
}
export function renderInvoice(invoice: Invoice, ownerCopy = false, testMode = false) {
  const ref = referenceFor(invoice.id);
  const b = invoice.bank;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/></head>
  <body style="background:#f7f7f7;margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1b1b1b">
    <div style="background:#fff;max-width:660px;margin:auto;padding:36px;border:1px solid #e2e2e2">
      <div style="font-size:14px;letter-spacing:4px;font-weight:700">MAISON AMIRAL</div>
      <p style="font-size:11px;letter-spacing:2px;color:#666">EDITION 001 / JOHANNESBURG</p>
      <h1 style="font-family:Georgia,serif;font-weight:400;font-size:42px;margin:30px 0 12px">${testMode ? "Invoice email test." : ownerCopy ? "New order received." : "Your order invoice."}</h1>
      <p>Order reference: <strong>${ref}</strong></p>
      <p style="color:#555">${testMode ? "TEST ONLY — no order has been placed. Do not make payment." : "Status: Awaiting EFT payment. This invoice is not proof of payment."}</p>
      ${invoiceTable(invoice)}
      ${testMode ? "" : `<h2 style="font-size:17px">EFT banking details</h2>
      <p>Bank: <strong>${escape(b.bankName)}</strong><br/>Account holder: <strong>${escape(b.accountHolder)}</strong><br/>
      Account number: <strong>${escape(b.accountNumber)}</strong>
      ${b.branchCode ? `<br/>Branch code: <strong>${escape(b.branchCode)}</strong>` : ""}
      ${b.accountType ? `<br/>Account type: <strong>${escape(b.accountType)}</strong>` : ""}<br/>
      Payment reference: <strong>${ref}</strong></p>
      <p style="font-size:13px;line-height:1.6">Please use the payment reference exactly as shown.
      Your order will be processed only after Maison Amiral verifies receipt of the funds.</p>`}
      ${ownerCopy ? `<hr/><h2 style="font-size:17px">Customer & delivery details</h2><p>
      ${escape(invoice.buyer.firstName)} ${escape(invoice.buyer.lastName)}<br/>
      ${escape(invoice.buyer.email)} / ${escape(invoice.buyer.phone)}<br/>
      ${escape(invoice.buyer.address)}<br/>${escape(invoice.buyer.suburb)}<br/>
      ${escape(invoice.buyer.city)}, ${escape(invoice.buyer.province)} ${escape(invoice.buyer.postalCode)}</p>` : ""}
      <p style="color:#777;font-size:11px;margin-top:40px">MAISON AMIRAL / SOUTH AFRICA</p>
    </div></body></html>`;
}
export async function sendOrderEmail(to: string, invoice: Invoice, apiKey: string,
  from: string, ownerCopy: boolean, testMode = false) {
  const send = () => fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json",
      "Idempotency-Key": invoice.id + (ownerCopy ? "-store-" : "-customer-") + createHash("sha256").update(to.toLowerCase()).digest("hex").slice(0, 16) },
    body: JSON.stringify({ from, to: [to],
      subject: `${testMode ? "TEST ONLY | " : ""}${ownerCopy ? "New order" : "Your EFT invoice"} | ${referenceFor(invoice.id)} | Maison Amiral`,
      html: renderInvoice(invoice, ownerCopy, testMode) }),
    signal: AbortSignal.timeout(12000), cache: "no-store",
  });
  let response = await send();
  for (let retry = 0; response.status === 429 && retry < 2; retry++) {
    const seconds = Number(response.headers.get("retry-after"));
    const delay = Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, 4000) : 1000 * (retry + 1);
    await new Promise(resolve => setTimeout(resolve, delay));
    response = await send();
  }
  if (!response.ok) {
    const details = await response.json().catch(() => ({})) as { message?: string };
    throw new Error("Resend rejected order notification (" + response.status + "): " + (details.message ?? "Unknown error").slice(0, 300));
  }
  const value = await response.json() as { id?: string };
  if (!value.id) throw new Error("Resend did not acknowledge order email");
  return value.id;
}
