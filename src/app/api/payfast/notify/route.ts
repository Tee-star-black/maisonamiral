import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

function payfastEncode(value: string) {
  return encodeURIComponent(value.trim())
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function signatureFromParams(params: URLSearchParams, passphrase: string) {
  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key !== "signature" && value !== "") pairs.push(`${key}=${payfastEncode(value)}`);
  });
  pairs.push(`passphrase=${payfastEncode(passphrase)}`);
  return createHash("md5").update(pairs.join("&")).digest("hex");
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const params = new URLSearchParams(raw);
  const sandbox = process.env.PAYFAST_SANDBOX !== "false";
  const passphrase = process.env.PAYFAST_PASSPHRASE || (sandbox ? "jt7NOE43FZPn" : "");

  if (!passphrase) return new NextResponse("PayFast not configured", { status: 500 });

  const receivedSignature = params.get("signature") ?? "";
  const expectedSignature = signatureFromParams(params, passphrase);
  if (!receivedSignature || receivedSignature !== expectedSignature) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const validationUrl = sandbox
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";

  const validation = await fetch(validationUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: raw,
    cache: "no-store",
  });
  const validationText = (await validation.text()).trim();

  if (!validation.ok || validationText !== "VALID") {
    return new NextResponse("Invalid transaction", { status: 400 });
  }

  const paymentStatus = params.get("payment_status");
  const orderId = params.get("m_payment_id");
  const amount = params.get("amount_gross");

  console.info("PayFast ITN", { orderId, paymentStatus, amount });
  return new NextResponse("OK", { status: 200 });
}
