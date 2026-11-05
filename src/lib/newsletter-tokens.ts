import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

type Purpose = "confirm" | "unsubscribe";
const secret = () => {
  const key = process.env.MAISON_NEWSLETTER_SECRET;
  if (!key || key.length < 32) throw new Error("Newsletter signing secret not configured");
  return key;
};
export function createNewsletterToken(email: string, purpose: Purpose) {
  const expires = Math.floor(Date.now() / 1000) + (purpose === "confirm" ? 48 * 3600 : 3650 * 86400);
  const payload = Buffer.from(JSON.stringify({ email, purpose, expires })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return payload + "." + signature;
}
export function verifyNewsletterToken(value: unknown, purpose: Purpose): string | null {
  if (typeof value !== "string" || value.length > 1400) return null;
  const parts = value.split(".");
  if (parts.length !== 2 || parts[0].length > 1200 || parts[1].length !== 43) return null;
  const expected = createHmac("sha256", secret()).update(parts[0]).digest();
  let actual: Buffer;
  try { actual = Buffer.from(parts[1], "base64url"); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(parts[0], "base64url").toString()) as Record<string, unknown>;
    if (parsed.purpose !== purpose || !Number.isFinite(parsed.expires) ||
        (parsed.expires as number) < Date.now() / 1000 ||
        typeof parsed.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.email)) return null;
    return parsed.email;
  } catch { return null; }
}
