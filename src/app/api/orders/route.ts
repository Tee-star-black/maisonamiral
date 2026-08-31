import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/data/products";
import { maisonEmailShell } from "@/lib/email/maisonEmail";

type CartLine = { slug: string; size: string; quantity: number };
type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  postalCode: string;
};

type ValidatedLine = {
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

function isCustomer(value: unknown): value is Customer {
  if (!value || typeof value !== "object") return false;
  const customer = value as Record<string, unknown>;
  return ["firstName", "lastName", "email", "phone", "address1", "city", "province", "postalCode"].every(
    (key) => typeof customer[key] === "string" && customer[key]!.toString().trim().length > 0,
  );
}

function money(value: number) {
  return `R${value.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("ORDER_FROM_EMAIL");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Order email failed", detail);
    throw new Error("Unable to send the order email.");
  }
}

function invoiceEmail({ orderId, customer, lines, subtotal, bank }: {
  orderId: string;
  customer: Customer;
  lines: ValidatedLine[];
  subtotal: number;
  bank: { bankName: string; accountName: string; accountNumber: string; branchCode: string; accountType: string };
}) {
  const lineRows = lines.map((line) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #d9d9d9;">${escapeHtml(line.name)}<br><span style="color:#777;font-size:11px;letter-spacing:.6px;text-transform:uppercase;">Size ${escapeHtml(line.size)} / Qty ${line.quantity}</span></td>
      <td style="padding:14px 0;border-bottom:1px solid #d9d9d9;text-align:right;">${money(line.lineTotal)}</td>
    </tr>`).join("");

  const delivery = [customer.address1, customer.address2, customer.city, customer.province, customer.postalCode]
    .filter(Boolean)
    .map((part) => escapeHtml(String(part)))
    .join("<br>");

  return maisonEmailShell({
    eyebrow: `ORDER / ${orderId}`,
    title: `Thank you, ${customer.firstName}.`,
    preheader: `Maison Amiral order ${orderId} and EFT payment details.`,
    body: `
      <p style="margin:0 0 30px;max-width:560px;">Your object has been reserved pending EFT payment. Use <strong>${escapeHtml(orderId)}</strong> as the payment reference.</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 34px;">${lineRows}
        <tr><td style="padding:18px 0;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;">Total due</td><td style="padding:18px 0;text-align:right;font-weight:bold;">${money(subtotal)}</td></tr>
      </table>

      <div style="background:#111111;color:#ffffff;padding:22px 20px;margin:0 0 32px;">
        <p style="margin:0 0 16px;font-size:9px;letter-spacing:1.8px;text-transform:uppercase;color:#a8a8a8;">PAYMENT SIGNAL / EFT</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;line-height:1.9;color:#ffffff;">
          <tr><td>Bank</td><td align="right"><strong>${escapeHtml(bank.bankName)}</strong></td></tr>
          <tr><td>Account name</td><td align="right"><strong>${escapeHtml(bank.accountName)}</strong></td></tr>
          <tr><td>Account number</td><td align="right"><strong>${escapeHtml(bank.accountNumber)}</strong></td></tr>
          <tr><td>Account type</td><td align="right"><strong>${escapeHtml(bank.accountType)}</strong></td></tr>
          <tr><td>Branch code</td><td align="right"><strong>${escapeHtml(bank.branchCode)}</strong></td></tr>
          <tr><td>Reference</td><td align="right"><strong>${escapeHtml(orderId)}</strong></td></tr>
        </table>
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #d9d9d9;border-bottom:1px solid #d9d9d9;">
        <tr>
          <td style="padding:18px 0;vertical-align:top;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#777;">DELIVERY / JHB</td>
          <td align="right" style="padding:18px 0;font-size:13px;line-height:1.7;">${delivery}<br>${escapeHtml(customer.phone)}</td>
        </tr>
      </table>

      <p style="margin:30px 0 0;color:#666;font-size:12px;">Your order will move to fulfilment once payment is confirmed. Keep this message as your order record.</p>
    `,
  });
}

function ownerOrderEmail({ orderId, customer, lines, subtotal }: { orderId: string; customer: Customer; lines: ValidatedLine[]; subtotal: number }) {
  const delivery = [customer.address1, customer.address2, customer.city, customer.province, customer.postalCode]
    .filter(Boolean)
    .map((part) => escapeHtml(String(part)))
    .join("<br>");

  return maisonEmailShell({
    eyebrow: `HOUSE ORDER / ${orderId}`,
    title: "New order received.",
    preheader: `New Maison Amiral order ${orderId}.`,
    body: `
      <p style="margin:0 0 28px;"><strong>${escapeHtml(customer.firstName)} ${escapeHtml(customer.lastName)}</strong><br>${escapeHtml(customer.email)}<br>${escapeHtml(customer.phone)}</p>
      <div style="border-top:1px solid #d9d9d9;border-bottom:1px solid #d9d9d9;padding:18px 0;margin-bottom:28px;">
        ${lines.map((line) => `<p style="margin:8px 0;">${line.quantity} × ${escapeHtml(line.name)} / Size ${escapeHtml(line.size)} <span style="float:right;">${money(line.lineTotal)}</span></p>`).join("")}
        <p style="margin:18px 0 0;font-weight:bold;">TOTAL <span style="float:right;">${money(subtotal)}</span></p>
      </div>
      <p style="margin:0 0 6px;font-size:9px;letter-spacing:1.4px;text-transform:uppercase;color:#777;">DELIVERY</p>
      <p style="margin:0 0 28px;line-height:1.7;">${delivery}</p>
      <p style="margin:0;">Await EFT payment using reference <strong>${escapeHtml(orderId)}</strong>.</p>
    `,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? (body.items as CartLine[]) : [];
    const customer = body.customer;

    if (!isCustomer(customer) || items.length === 0) {
      return NextResponse.json({ error: "Checkout details or bag are incomplete." }, { status: 400 });
    }

    let subtotal = 0;
    const lines: ValidatedLine[] = [];

    for (const item of items) {
      const product = getProduct(item.slug);
      if (!product || !product.sizes.includes(item.size) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
        return NextResponse.json({ error: "One or more bag items are invalid." }, { status: 400 });
      }

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      lines.push({ name: product.shortName, size: item.size, quantity: item.quantity, unitPrice: product.price, lineTotal });
    }

    const orderId = `MA-${randomUUID().split("-")[0].toUpperCase()}`;
    const bank = {
      bankName: requireEnv("BANK_NAME"),
      accountName: requireEnv("BANK_ACCOUNT_NAME"),
      accountNumber: requireEnv("BANK_ACCOUNT_NUMBER"),
      branchCode: requireEnv("BANK_BRANCH_CODE"),
      accountType: requireEnv("BANK_ACCOUNT_TYPE"),
    };

    await sendEmail({
      to: customer.email,
      subject: `Maison Amiral / Order ${orderId}`,
      html: invoiceEmail({ orderId, customer, lines, subtotal, bank }),
    });

    const ownerEmail = requireEnv("OWNER_ORDER_EMAIL");
    await sendEmail({
      to: ownerEmail,
      subject: `House order ${orderId} / ${money(subtotal)}`,
      html: ownerOrderEmail({ orderId, customer, lines, subtotal }),
    });

    return NextResponse.json({ orderId, total: subtotal });
  } catch (cause) {
    console.error("Order creation failed", cause);
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Unable to create your order." },
      { status: 500 },
    );
  }
}
