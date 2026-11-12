import { getCatalogue } from "@/lib/catalogue";
import { getDeliveryFee, getEftSettings, validateBuyer, validateItems } from "@/lib/commerce";
import { referenceFor, sendOrderEmail } from "@/lib/eft-invoice";
import { storeDb } from "@/lib/maison-store-db";

export const runtime = "nodejs";
type Order = { id:string; email:string; total_cents:number; notification_status:string; status:string;
  first_name:string; last_name:string; phone:string; address:string; suburb:string; city:string; province:string; postal_code:string;
  items: ReturnType<typeof validateItems> };
const orderSelect = "id,email,total_cents,notification_status,status,first_name,last_name,phone,address,suburb,city,province,postal_code,items";
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
  let catalogue;
  try { catalogue = await getCatalogue(); } catch { return json({error:"The catalogue is unavailable. Please try again."},503); }
  const items = validateItems(body.items, catalogue);
  if (!buyer || !items) return json({ error:"Please check your details, items, sizes and quantities." },400);
  const fee = getDeliveryFee(items);
  const subtotal = items.reduce((sum,item)=>sum+item.unit_price_cents*item.quantity,0);
  const total = subtotal + fee;
  if (!Number.isSafeInteger(total) || total <= 0 || total > 5000000)
    return json({ error:"Order total is outside the accepted limits." },400);

  // A per-checkout UUID is retained in sessionStorage across retries. No duplicates on refresh.
  const id = typeof body.checkoutId === "string" ? body.checkoutId : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    return json({ error:"Invalid checkout attempt. Please refresh and try again." },400);

  const matches = (order: Order) => order.email === buyer.email && order.total_cents === total &&
    order.first_name === buyer.firstName && order.last_name === buyer.lastName &&
    order.phone === buyer.phone && order.address === buyer.address && order.suburb === buyer.suburb &&
    order.city === buyer.city && order.province === buyer.province && order.postal_code === buyer.postalCode &&
    JSON.stringify(order.items?.map(({slug,size,quantity}) => ({slug,size,quantity}))) ===
    JSON.stringify(items.map(({slug,size,quantity}) => ({slug,size,quantity})));
  let isNew = false;
  try {
    const existing = await storeDb<Order[]>("maison_orders","GET", {
      query: { select:orderSelect,id:"eq."+id,limit:"1" },
    });
    if (existing.length) {
      if (!matches(existing[0]))
        return json({ error:"This checkout reference belongs to another order. Reload checkout to try again." },409);
      if (existing[0].notification_status === "sent" || existing[0].status !== "awaiting_payment")
        return json({ orderId:id,reference:referenceFor(id),notificationStatus:existing[0].notification_status,
          message:"Your order was already created. Do not submit another bank transfer for this reference." });
      // A previous attempt may have stopped between persistence and email delivery.
      // Recipient-specific Resend idempotency keys make resuming safe within its retry window.
      const age = Date.now() - Date.parse((await storeDb<{created_at:string}[]>("maison_orders", "GET", {
        query:{select:"created_at",id:"eq."+id,limit:"1"},
      }))[0]?.created_at ?? "");
      if (!Number.isFinite(age) || age > 23 * 3600_000)
        return json({orderId:id,reference:referenceFor(id),notificationStatus:existing[0].notification_status,
          message:"Your order exists. Contact support with this reference before making payment."});
      isNew = true;
    } else {
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
    }
  } catch {
    const existing = await storeDb<Order[]>("maison_orders","GET",{
      query:{select:orderSelect,id:"eq."+id,limit:"1"},
    }).catch(()=>[]);
    if (existing.length && matches(existing[0]))
      return json({orderId:id,reference:referenceFor(id),notificationStatus:existing[0].notification_status});
    return json({error:"We couldn't save your order. No payment is required yet."},503);
  }
  if (!isNew) return json({error:"Unable to create order."},503);

  const invoice = { replyTo:process.env.MAISON_REPLY_TO, id,buyer,items,subtotalCents:subtotal,deliveryCents:fee,totalCents:total,bank:settings.bank };
  const sent: PromiseSettledResult<string>[] = [];
  const recipients = [buyer.email, ...settings.adminRecipients];
  for (let index = 0; index < recipients.length; index++) {
    if (index) await new Promise(resolve => setTimeout(resolve, 600));
    try { sent.push({status:"fulfilled",value:await sendOrderEmail(recipients[index],invoice,settings.key,settings.sender,index > 0)}); }
    catch (reason) { sent.push({status:"rejected",reason}); }
  }
  if(process.env.MAISON_CATALOGUE_ENABLED==='true') {
    for(let index=0;index<sent.length;index++) {
      const result=sent[index]; if(result.status==='fulfilled') {
        await storeDb('maison_email_events','POST',{body:{id:'invoice-'+id+'-'+index,event_type:'email.sent',email_id:result.value,recipient:recipients[index],subject:'EFT invoice | '+referenceFor(id),order_id:id},prefer:'resolution=ignore-duplicates,return=minimal'}).catch(()=>console.error('Email history save failed',{orderId:id}));
      }
    }
  }
  const customerSent = sent[0].status==="fulfilled";
  const ownerSent = sent.slice(1).every((result) => result.status === "fulfilled");
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
