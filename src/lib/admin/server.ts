import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
export const COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Host-maison-admin-session"
    : "maison-admin-session";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function db() {
  const url = process.env.MAISON_SUPABASE_URL,
    key = process.env.MAISON_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new HttpError(503, "Store connection is unavailable.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function reply(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function failure(e: unknown) {
  if (e instanceof HttpError) return reply({ error: e.message }, e.status);
  console.error(
    "Maison admin operation failed",
    e instanceof Error ? e.message : "Unknown",
  );
  return reply(
    { error: "Unable to complete this action. Please try again." },
    503,
  );
}
export function sameOrigin(r: Request) {
  const origin = r.headers.get("origin");
  const expected = process.env.MAISON_SITE_ORIGIN || new URL(r.url).origin;
  if (
    !origin ||
    origin !== expected ||
    r.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new HttpError(
      403,
      "Please submit this action from the store dashboard.",
    );
}
export async function readJson(r: Request, max = 64000) {
  const reader = r.body?.getReader();
  if (!reader) throw new HttpError(400, "Missing request.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, "Request is too large.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw new HttpError(400, "Invalid request.");
  }
}
export async function rateLimit(key: string, limit = 60) {
  const { data, error } = await db().rpc("maison_rate_limit", {
    p_key: createHash("sha256").update(key).digest("hex"),
    p_limit: limit,
  });
  if (error) throw error;
  if (!data)
    throw new HttpError(429, "Too many attempts. Please wait a minute.");
}
export async function requireAdmin(write = false) {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) throw new HttpError(401, "Sign in to continue.");
  const client = db();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user)
    throw new HttpError(401, "Your session expired. Please sign in.");
  const { data: member, error: memberError } = await client
    .from("maison_admins")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("active", true)
    .single();
  if (memberError || !member)
    throw new HttpError(403, "This account does not have store access.");
  // getUser verifies the token first; never trust user-editable metadata for roles.
  const claims = JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString(),
  );
  const { data: session, error: sessionError } = await client.rpc(
    "maison_session_active",
    { p_session: claims.session_id, p_user: data.user.id },
  );
  if (sessionError || !session)
    throw new HttpError(401, "Session revoked. Please sign in.");
  if (claims.aal !== "aal2")
    throw new HttpError(403, "Complete two-factor authentication.");
  if (write && member.role !== "owner")
    throw new HttpError(403, "Only the owner can change store records.");
  return { id: data.user.id, role: member.role, email: data.user.email };
}
export async function mutate(r: Request) {
  sameOrigin(r);
  const user = await requireAdmin(true);
  await rateLimit("admin:" + user.id);
  return user;
}
