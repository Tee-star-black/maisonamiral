import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function setup() {
  const exports = {},
    cookies = new Map();
  const cookieOptions = [];
  const db = () => {
    let signedIn = false;
    return {
      auth: {
        signInWithPassword: async () => {
          signedIn = true;
          return {
            data: {
              user: { id: "owner" },
              session: { access_token: "access", refresh_token: "refresh" },
            },
            error: null,
          };
        },
        setSession: async () => {
          signedIn = true;
          return { data: { user: { id: "owner" } }, error: null };
        },
        mfa: {
          listFactors: async () => ({
            data: { totp: [{ id: "11111111-1111-4111-8111-111111111111" }] },
            error: null,
          }),
          challengeAndVerify: async () => ({
            data: { access_token: "mfa-access" },
            error: null,
          }),
        },
      },
      from: () => {
        assert.equal(
          signedIn,
          false,
          "membership lookup must use a fresh server client, not the signed-in Auth client",
        );
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({ single: async () => ({ data: { role: "owner" } }) }),
            }),
          }),
        };
      },
    };
  };
  vm.runInNewContext(
    ts.transpileModule(
      readFileSync(
        new URL("../src/app/api/admin/auth/route.ts", import.meta.url),
        "utf8",
      ),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      process: { env: { NODE_ENV: "production" } },
      Request,
      Response,
      console,
      require: (n) =>
        n === "next/headers"
          ? {
              cookies: async () => ({
                get: (k) =>
                  cookies.has(k) ? { value: cookies.get(k) } : undefined,
                set: (k, v, o) => {
                  cookies.set(k, v);
                  cookieOptions.push(o);
                },
                delete: (k) => cookies.delete(k),
              }),
            }
          : n === "@/lib/admin/server"
            ? {
                COOKIE: "session",
                db,
                HttpError,
                failure: (e) =>
                  Response.json(
                    { error: e.message },
                    { status: e.status || 503 },
                  ),
                reply: (data) => Response.json(data),
                readJson: (r) => r.json(),
                sameOrigin: () => {},
                rateLimit: async () => {},
              }
            : require(n),
    },
  );
  return {
    post: (body) =>
      exports.POST(
        new Request("https://shop.example", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      ),
    cookies,
    cookieOptions,
  };
}
test("password login checks server-side membership and stores only HttpOnly secure cookies", async () => {
  const run = setup();
  const response = await run.post({
    action: "login",
    email: "owner@example.invalid",
    password: "test-only-password",
  });
  assert.equal(response.status, 200);
  assert.equal(
    (await response.json()).factorId,
    "11111111-1111-4111-8111-111111111111",
  );
  for (const option of run.cookieOptions) {
    assert.equal(option.httpOnly, true);
    assert.equal(option.secure, true);
    assert.equal(option.sameSite, "strict");
  }
  assert.equal(run.cookies.get("session"), "access");
});
test("MFA verification replaces the access token and discards the temporary refresh cookie", async () => {
  const run = setup();
  await run.post({
    action: "login",
    email: "owner@example.invalid",
    password: "test-only-password",
  });
  const response = await run.post({
    action: "verify",
    factorId: "11111111-1111-4111-8111-111111111111",
    code: "123456",
  });
  assert.equal(response.status, 200);
  assert.equal(run.cookies.get("session"), "mfa-access");
  assert.equal(run.cookies.has("__Host-maison-admin-refresh"), false);
});
