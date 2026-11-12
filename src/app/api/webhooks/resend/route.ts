import { Webhook } from "svix";
import { db, reply, failure, HttpError } from "@/lib/admin/server";
export const runtime = "nodejs";
export async function POST(r: Request) {
  try {
    if (!process.env.RESEND_WEBHOOK_SECRET)
      throw new HttpError(503, "Webhook unavailable.");
    // Bound raw payload before signature verification; verify exactly the received bytes.
    const reader = r.body?.getReader();
    if (!reader) throw new HttpError(400, "Missing payload.");
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 256000) {
        await reader.cancel();
        throw new HttpError(413, "Payload too large.");
      }
      chunks.push(value);
    }
    const raw = Buffer.concat(chunks).toString();
    let event: {
      type: string;
      created_at: string;
      data: {
        email_id?: string;
        from?: string;
        to?: string[];
        subject?: string;
      };
    };
    try {
      event = new Webhook(process.env.RESEND_WEBHOOK_SECRET).verify(raw, {
        "svix-id": r.headers.get("svix-id") || "",
        "svix-timestamp": r.headers.get("svix-timestamp") || "",
        "svix-signature": r.headers.get("svix-signature") || "",
      }) as unknown as typeof event;
    } catch {
      throw new HttpError(400, "Invalid signature.");
    }
    let text: string | null = null;
    if (event.type === "email.received" && event.data.email_id) {
      const response = await fetch(
        "https://api.resend.com/emails/receiving/" +
          encodeURIComponent(event.data.email_id),
        {
          headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY },
          signal: AbortSignal.timeout(12000),
          cache: "no-store",
        },
      );
      if (!response.ok) throw Error("Inbound email fetch failed");
      const body = await response.json();
      text =
        typeof body.text === "string"
          ? body.text.slice(0, 30000)
          : "[This message has no plain-text body.]";
    }
    const { data: related } = event.data.email_id
      ? await db()
          .from("maison_email_events")
          .select("order_id")
          .eq("email_id", event.data.email_id)
          .not("order_id", "is", null)
          .limit(1)
      : { data: null };
    const { error } = await db()
      .from("maison_email_events")
      .upsert(
        {
          id: r.headers.get("svix-id"),
          sender: event.data.from?.slice(0, 500),
          order_id: related?.[0]?.order_id || null,
          event_type: event.type,
          email_id: event.data.email_id,
          recipient: event.data.to?.join(", ").slice(0, 1000),
          subject: event.data.subject?.slice(0, 500),
          body_text: text,
          created_at: event.created_at,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
    if (error) throw error;
    return reply({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
