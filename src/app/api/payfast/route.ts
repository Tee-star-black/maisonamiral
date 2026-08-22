import { createHash, randomUUID } from "node:crypto";
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

function payfastEncode(value: string) {
  return encodeURIComponent(value.trim())
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function generateSignature(fields: Record<string, string>, passphrase?: string) {
  const body = Object.entries(fields)
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${key}=${payfastEncode(value)}`)
    .join("&");
  const signed = passphrase ? `${body}&passphrase=${payfastEncode(passphrase)}` : body;
  return createHash("md5").update(signed).digest("hex");
}

function isCustomer(value: unknown): value is Customer {
  if (!value || typeof value !== "object") return false;
  const customer = value as Record<string, unknown>;
  return ["firstName", "lastName", "email", "phone", "address1", "city", "province", "postalCode"].every(
    (key) => typeof customer[key] === "string" && customer[key]!.toString().trim().length > 0,
  );
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
    const validated: string[] = [];

    for (const item of items) {
      const product = getProduct(item.slug);
      if (!product || !product.sizes.includes(item.size) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
        return NextResponse.json({ error: "One or more bag items are invalid." }, { status: 400 });
      }
      subtotal += product.price * item.quantity;
      validated.push(`${item.quantity}x ${product.shortName} ${item.size}`);
    }

    if (subtotal < 5) {
      return NextResponse.json({ error: "Order total is below the payment minimum." }, { status: 400 });
    }

    const sandbox = process.env.PAYFAST_SANDBOX !== "false";
    const merchantId = process.env.PAYFAST_MERCHANT_ID || (sandbox ? "10000100" : "");
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY || (sandbox ? "46f0cd694581a" : "");
    const passphrase = process.env.PAYFAST_PASSPHRASE || (sandbox ? "jt7NOE43FZPn" : "");

    if (!merchantId || !merchantKey || !passphrase) {
      return NextResponse.json({ error: "PayFast live credentials are not configured." }, { status: 500 });
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/$/, "");
    const orderId = `MA-${randomUUID().split("-")[0].toUpperCase()}`;

    const fields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${siteUrl}/payment/success?order=${encodeURIComponent(orderId)}`,
      cancel_url: `${siteUrl}/payment/cancel?order=${encodeURIComponent(orderId)}`,
      notify_url: `${siteUrl}/api/payfast/notify`,
      name_first: customer.firstName,
      name_last: customer.lastName,
      email_address: customer.email,
      cell_number: customer.phone,
      m_payment_id: orderId,
      amount: subtotal.toFixed(2),
      item_name: `Maison Amiral ${orderId}`,
      item_description: validated.join(", ").slice(0, 255),
    };

    fields.signature = generateSignature(fields, passphrase);

    return NextResponse.json({
      action: sandbox ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process",
      fields,
      orderId,
    });
  } catch {
    return NextResponse.json({ error: "Unable to prepare the PayFast payment." }, { status: 500 });
  }
}
