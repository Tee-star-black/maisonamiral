import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/data/products";

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

function invoiceEmail({
  orderId,
  customer,
  lines,
  subtotal,
  bank,
}: {
  orderId: string;
  customer: Customer;
  lines: ValidatedLine[];
  subtotal: number;
  bank: { bankName: string; accountName: string; accountNumber: string; branchCode: string; accountType: string };
}) {
  const lineRows = lines
    .map(
      (line) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #ddd">${escapeHtml(line.name)}<br><span style="color:#777;font-size:12px">Size ${escapeHtml(line.size)} · Qty ${line.quantity}</span></td>
          <td style="padding:12px 0;border-bottom:1px solid #ddd;text-align:right">${money(line.lineTotal)}</td>
        </tr>`,
    )
    .join("");

  const delivery = [customer.address1, customer.address2, customer.city, customer.province, customer.postalCode]
    .filter(Boolean)
    .map((part) => escapeHtml(String(part)))
    .join("<br>");

  return `
  <!doctype html>
  <html>
    <body style="margin:0;background:#f3f0e9;color:#111;font-family:Arial,Helvetica,sans-serif">
      <div style="max-width:720px;margin:0 auto;padding:40px 24px 64px">
        <p style="font-size:12px;letter-spacing:2px;margin:0 0 40px"><strong>MAISON AMIRAL</strong></p>
        <p style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#777">Order / Invoice</p>
        <h1 style="font-size:46px;line-height:1;margin:0 0 12px;font-weight:500">Thank you, ${escapeHtml(customer.firstName)}.</h1>
        <p style="font-size:16px;line-height:1.6;color:#555;margin:0 0 36px">Your order has been reserved pending EFT payment. Use <strong>${escapeHtml(orderId)}</strong> as your payment reference.</p>

        <table style="width:100%;border-collapse:collapse;margin:0 0 30px">${lineRows}
          <tr><td style="padding:18px 0;font-weight:bold">Total due</td><td style="padding:18px 0;text-align:right;font-weight:bold">${money(subtotal)}</td></tr>
        </table>

        <div style="border-top:1px solid #111;padding-top:24px;margin-top:20px">
          <p style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#777">EFT payment details</p>
          <table style="width:100%;font-size:14px;line-height:1.8">
            <tr><td>Bank</td><td style="text-align:right"><strong>${escapeHtml(bank.bankName)}</strong></td></tr>
            <tr><td>Account name</td><td style="text-align:right"><strong>${escapeHtml(bank.accountName)}</strong></td></tr>
            <tr><td>Account number</td><td style="text-align:right"><strong>${escapeHtml(bank.accountNumber)}</strong></td></tr>
            <tr><td>Account type</td><td style="text-align:right"><strong>${escapeHtml(bank.accountType)}</strong></td></tr>
            <tr><td>Branch code</td><td style="text-align:right"><strong>${escapeHtml(bank.branchCode)}</strong></td></tr>
            <tr><td>Payment reference</td><td style="text-align:right"><strong>${escapeHtml(orderId)}</strong></td></tr>
          </table>
        </div>

        <div style="border-top:1px solid #ddd;padding-top:24px;margin-top:34px">
          <p style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#777">Delivery details</p>
          <p style="font-size:14px;line-height:1.7">${delivery}<br>${escapeHtml(customer.phone)}</p>
        </div>

        <p style="margin-top:38px;font-size:13px;line-height:1.6;color:#666">Your order will be processed once payment has been confirmed. Please keep this email for your records.</p>
      </div>
    </body>
  </html>`;
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
      lines.push({
        name: product.shortName,
        size: item.size,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal,
      });
    }

    const orderId = `MA-${randomUUID().split("-")[0].toUpperCase()}`;
    const bank = {
      bankName: requireEnv("BANK_NAME"),
      accountName: requireEnv("BANK_ACCOUNT_NAME"),
      accountNumber: requireEnv("BANK_ACCOUNT_NUMBER"),
      branchCode: requireEnv("BANK_BRANCH_CODE"),
      accountType: requireEnv("BANK_ACCOUNT_TYPE"),
    };

    const customerHtml = invoiceEmail({ orderId, customer, lines, subtotal, bank });
    await sendEmail({
      to: customer.email,
      subject: `Maison Amiral order ${orderId} · EFT payment details`,
      html: customerHtml,
    });

    const ownerEmail = requireEnv("OWNER_ORDER_EMAIL");
    const ownerHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:720px;margin:auto;padding:32px">
        <h1>New Maison Amiral order ${escapeHtml(orderId)}</h1>
        <p><strong>${escapeHtml(customer.firstName)} ${escapeHtml(customer.lastName)}</strong><br>${escapeHtml(customer.email)}<br>${escapeHtml(customer.phone)}</p>
        <p><strong>Total:</strong> ${money(subtotal)}</p>
        <ul>${lines.map((line) => `<li>${line.quantity} × ${escapeHtml(line.name)} · Size ${escapeHtml(line.size)} · ${money(line.lineTotal)}</li>`).join("")}</ul>
        <p><strong>Delivery:</strong><br>${[customer.address1, customer.address2, customer.city, customer.province, customer.postalCode].filter(Boolean).map((part) => escapeHtml(String(part))).join("<br>")}</p>
        <p>Await EFT payment using reference <strong>${escapeHtml(orderId)}</strong>.</p>
      </div>`;

    await sendEmail({
      to: ownerEmail,
      subject: `New order ${orderId} · ${money(subtotal)}`,
      html: ownerHtml,
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
