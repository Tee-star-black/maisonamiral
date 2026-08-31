import { NextRequest, NextResponse } from "next/server";
import { welcomeEmail } from "@/lib/email/maisonEmail";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function isEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function resendRequest(path: string, init: RequestInit) {
  const apiKey = requireEnv("RESEND_API_KEY");
  return fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

async function upsertContact(email: string, firstName?: string) {
  const create = await resendRequest("/contacts", {
    method: "POST",
    body: JSON.stringify({
      email,
      firstName: firstName || undefined,
      unsubscribed: false,
      properties: {
        source: "maisonamiral.co.za",
        correspondence: "house",
      },
    }),
  });

  if (create.ok) return;

  if (create.status !== 409) {
    const detail = await create.text();
    console.error("Resend contact creation failed", detail);
    throw new Error("Unable to add you to House Correspondence.");
  }

  const update = await resendRequest(`/contacts/${encodeURIComponent(email)}`, {
    method: "PATCH",
    body: JSON.stringify({
      firstName: firstName || undefined,
      unsubscribed: false,
    }),
  });

  if (!update.ok) {
    const detail = await update.text();
    console.error("Resend contact update failed", detail);
    throw new Error("Unable to update your House Correspondence status.");
  }
}

async function attachNewsletterPreferences(email: string) {
  const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID?.trim();
  const topicId = process.env.RESEND_NEWSLETTER_TOPIC_ID?.trim();

  if (segmentId) {
    const response = await resendRequest(`/contacts/${encodeURIComponent(email)}/segments/${segmentId}`, {
      method: "POST",
    });
    if (!response.ok && response.status !== 409) {
      console.warn("Unable to add contact to newsletter segment", await response.text());
    }
  }

  if (topicId) {
    const response = await resendRequest(`/contacts/${encodeURIComponent(email)}/topics`, {
      method: "PATCH",
      body: JSON.stringify({ topics: [{ id: topicId, subscription: "opt_in" }] }),
    });
    if (!response.ok) {
      console.warn("Unable to opt contact into newsletter topic", await response.text());
    }
  }
}

async function sendWelcomeEmail(email: string, firstName?: string) {
  const from = process.env.NEWSLETTER_FROM_EMAIL?.trim() || requireEnv("ORDER_FROM_EMAIL");
  const response = await resendRequest("/emails", {
    method: "POST",
    body: JSON.stringify({
      from,
      to: [email],
      subject: "House Correspondence / Welcome to Maison Amiral",
      html: welcomeEmail(firstName),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Maison welcome email failed", detail);
    throw new Error("Your subscription was saved, but the welcome email could not be sent.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body?.email;
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim().slice(0, 80) : "";

    if (!isEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    await upsertContact(normalizedEmail, firstName || undefined);
    await attachNewsletterPreferences(normalizedEmail);
    await sendWelcomeEmail(normalizedEmail, firstName || undefined);

    return NextResponse.json({ ok: true, message: "House Correspondence is active." });
  } catch (cause) {
    console.error("Newsletter subscription failed", cause);
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Unable to subscribe right now." },
      { status: 500 },
    );
  }
}
