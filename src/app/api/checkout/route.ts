import { randomUUID } from "node:crypto";
import { getDeliveryFee, getEftSettings, validateBuyer, validateItems } from "@/lib/commerce";
import { referenceFor, sendOrderEmail } from "@/lib/eft-invoice";
import { storeDb } from "@/lib/maison-store-db";

export const runtime = "nodejs";
type Order = { id:string; email:string; total_cents:number; notification_status:string; status:string };
function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control":"no-store" } });
}
export async function GET() {
  return json({ enabled: getEftSettings().enabled, deliveryCents: getDeliveryFee(), currency: "ZAR", paymentMethod: "eft" });
}
export async function POST(request: Request) {
  const settings = getEftSettings();
  if (!settings.enabled) return json({ error:"EFT checkout is not configured yet. Please contact the store." }, 503);
  if (Number(request.headers.get("content-length") ?? 0) > 16000)
    return json({ error:"Checkout request too large." }, 413);
  let raw: unknown;
  try { raw = await request.json(); } catch { return json({ error:"Invalid checkout request." }, 400); }
  if (!raw || typeof raw !== "object") return json({ error:"Invalid checkout details." },400);
  const body = raw as Record<string,unknown>;
  const buyer = validateBuyer(body.customer);
  const items = validateItems(body.items);
  if (!buyer || !items) return json({ error:"Please check your details, items, sizes and quantities." },400);
  const fee = getDeliveryFee();
  if (fee === null) return json({ error:"Delivery pricing is unavailable." },503);
  const subtotal = items.reduce((sum,item)=>sum+item.unit_price_cents*item.quantity,0);
  const total = subtotal + fee;
  if (!Number.isSafeInteger(total) || total <= 0 || total > 5000000)
    return json({ error:"Order total is outside the accepted limits." },400);

  // A per-checkout UUID is retained in sessionStorage across retries. No duplicates on refresh.
  const id = typeof body.checkoutId === "string" ? body.checkoutId : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    return json({ error:"Invalid checkout attempt. Please refresh and try again." },400);

  let isNew = false;
  try {
    const existing = await storeDb<Order[]>("maison_orders","GET", {
      query: { select:"id,email,total_cents,notification_status,status",id:"eq."+id,limit:"1" },
    });
    if (existing.length) {
      if (existing[0].email !== buyer.email || existing[0].total_cents !== total)
        return json({ error:"This checkout reference belongs to another order. Reload checkout to try again." },409);
      return json({ orderId:id,reference:referenceFor(id),notificationStatus:existing[0].notification_status,
        message:"Your order was already created. Do not submit another bank transfer for this reference." });
    }
    // Treat unique-key conflict on concurrent inserts as an existing order on retry.
    await storeDb("maison_orders","POST", {
      body: { id, first_name:buyer.firstName,last_name:buyer.lastName,email:buyer.email,
        phone:buyer.phone,address:buyer.address,suburb:buyer.suburb,city:buyer.city,
        province:buyer.province,postal_code:buyer.postalCode,items,
        subtotal_cents:subtotal,delivery_cents:fee,total_cents:total,
        status:"awaiting_payment",notification_status:"pending" },
      prefer:"return=minimal",
    });
    isNew = true;
  } catch {
    const existing = await storeDb<Order[]>("maison_orders","GET",{
      query:{select:"id,email,total_cents,notification_status,status",id:"eq."+id,limit:"1"},
    }).catch(()=>[]);
    if (existing.length && existing[0].email===buyer.email && existing[0].total_cents===total)
      return json({orderId:id,reference:referenceFor(id),notificationStatus:existing[0].notification_status});
    return json({error:"We couldn't save your order. No payment is required yet."},503);
  }
  if (!isNew) return json({error:"Unable to create order."},503);

  const invoice = { id,buyer,items,subtotalCents:subtotal,deliveryCents:fee,totalCents:total,bank:settings.bank };
  const sent = await Promise.allSettled([
    sendOrderEmail(buyer.email,invoice,settings.key,settings.sender,false),
    sendOrderEmail(settings.admin,invoice,settings.key,settings.sender,true),
  ]);
  const customerSent = sent[0].status==="fulfilled";
  const ownerSent = sent[1].status==="fulfilled";
  const notificationStatus = customerSent && ownerSent ? "sent" : "needs_attention";
  try {
    await storeDb("maison_orders","PATCH",{
      query:{id:"eq."+id,status:"eq.awaiting_payment"},
      body:{notification_status:notificationStatus,updated_at:new Date().toISOString()},
      prefer:"return=minimal",
    });
  } catch {
    // Order still exists; operations must reconcile notification status before fulfilment.
  }
  if (!customerSent || !ownerSent)
    console.error("Maison order emails require reconciliation", {orderId:id,customerSent,ownerSent});
  return json({orderId:id,reference:referenceFor(id),notificationStatus,
    message:customerSent
      ? "Your order has been recorded. Check your email for the EFT invoice."
      : "Your order was recorded, but your invoice email could not be confirmed. Contact Maison Amiral with the reference."},201);
}
