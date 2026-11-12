import { cookies } from "next/headers";
import { z } from "zod";
import {
  COOKIE,
  db,
  failure,
  HttpError,
  readJson,
  reply,
  requireAdmin,
  sameOrigin,
  rateLimit,
} from "@/lib/admin/server";
const REFRESH =
  process.env.NODE_ENV === "production"
    ? "__Host-maison-admin-refresh"
    : "maison-admin-refresh";
const opts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 3600,
};
export async function GET() {
  try {
    return reply(await requireAdmin());
  } catch (e) {
    return failure(e);
  }
}
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    await rateLimit("auth:global", 100);
    const body = await readJson(r, 4000);
    const jar = await cookies();
    const client = db();
    await rateLimit(
      "auth:" +
        String(
          body.email || jar.get(COOKIE)?.value || "anonymous",
        ).toLowerCase(),
      10,
    );
    if (body.action === "logout") {
      const token = jar.get(COOKIE)?.value;
      if (token)
        await fetch(process.env.MAISON_SUPABASE_URL + "/auth/v1/logout", {
          method: "POST",
          headers: {
            apikey: process.env.MAISON_SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: "Bearer " + token,
          },
        });
      jar.delete(COOKIE);
      jar.delete(REFRESH);
      return reply({ ok: true });
    }
    if (body.action === "login") {
      const input = z
        .object({
          email: z.string().email().max(254),
          password: z.string().min(1).max(200),
        })
        .parse(body);
      const { data, error } = await client.auth.signInWithPassword(input);
      if (error || !data.session)
        throw new HttpError(401, "Unable to sign in with these credentials.");
      const { data: member } = await db()
        .from("maison_admins")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("active", true)
        .single();
      if (!member) {
        await client.auth.signOut();
        throw new HttpError(403, "This account does not have store access.");
      }
      jar.set(COOKIE, data.session.access_token, opts);
      jar.set(REFRESH, data.session.refresh_token, { ...opts, maxAge: 600 });
      const { data: factors, error: factorError } =
        await client.auth.mfa.listFactors();
      if (factorError) throw factorError;
      return reply({
        factorId: factors.totp[0]?.id,
        needsEnrollment: !factors.totp.length,
      });
    }
    const token = jar.get(COOKIE)?.value,
      refresh = jar.get(REFRESH)?.value;
    if (!token || !refresh) throw new HttpError(401, "Please sign in again.");
    const { data: session, error } = await client.auth.setSession({
      access_token: token,
      refresh_token: refresh,
    });
    if (error || !session.user)
      throw new HttpError(401, "Please sign in again.");
    const { data: member } = await db()
      .from("maison_admins")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("active", true)
      .single();
    if (!member) throw new HttpError(403, "Store access denied.");
    if (body.action === "enroll") {
      const { data: factors } = await client.auth.mfa.listFactors();
      if (factors?.totp.length)
        throw new HttpError(400, "Use your existing authenticator.");
      const { data: user } = await client.auth.getUser();
      for (const factor of user.user?.factors ?? [])
        if (factor.status === "unverified")
          await client.auth.mfa.unenroll({ factorId: factor.id });
      const { data, error } = await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Maison Amiral",
      });
      if (error) throw error;
      return reply({
        factorId: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
    }
    if (body.action === "verify") {
      const code = z
        .string()
        .regex(/^\d{6}$/)
        .parse(body.code);
      const factorId = z.string().uuid().parse(body.factorId);
      const { data, error } = await client.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      if (error)
        throw new HttpError(401, "The authenticator code was not accepted.");
      jar.set(COOKIE, data.access_token, opts);
      jar.delete(REFRESH);
      return reply({ ok: true });
    }
    throw new HttpError(400, "Unknown action.");
  } catch (e) {
    if (e instanceof z.ZodError)
      return reply({ error: "Check your sign-in details." }, 400);
    return failure(e);
  }
}
