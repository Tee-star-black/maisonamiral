import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const compile = (p) =>
  ts.transpileModule(readFileSync(new URL(p, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const validation = {};
vm.runInNewContext(compile("../src/lib/admin/validation.ts"), {
  exports: validation,
  require,
});
const product = {
  slug: "new-piece",
  name: "New piece",
  price: 60,
  category: "accessory",
  edition: "Accessories",
  shortDescription: "",
  description: "",
  images: ["/existing.jpg"],
  imageLabels: ["Front"],
  status: "published",
  stock: { "ONE SIZE": 2 },
};
test("published products require images, supported sizes and integer stock", () => {
  assert.equal(validation.productSchema.safeParse(product).success, true);
  for (const change of [
    { images: [] },
    { stock: { M: 2 } },
    { stock: { "ONE SIZE": -1 } },
    { price: 0 },
    { price: 12.345 },
    { images: ["javascript:alert(1)"] },
    { images: ["//evil.example/image.jpg"] },
    { stock: { "ONE SIZE": 1.5 } },
    { extra: "field" },
  ])
    assert.equal(
      validation.productSchema.safeParse({ ...product, ...change }).success,
      false,
    );
});
test("order transitions cannot skip payment or reverse fulfilment", () => {
  assert.equal(validation.canTransition("awaiting_payment", "paid"), true);
  for (const [a, b] of [
    ["awaiting_payment", "shipped"],
    ["paid", "awaiting_payment"],
    ["completed", "paid"],
    ["cancelled", "processing"],
  ])
    assert.equal(validation.canTransition(a, b), false);
});
function server({ token, user, member, session = true } = {}) {
  const exports = {};
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ single: async () => ({ data: member, error: null }) }),
        }),
      }),
    }),
    rpc: async () => ({ data: session, error: null }),
  };
  vm.runInNewContext(compile("../src/lib/admin/server.ts"), {
    exports,
    process: {
      env: {
        MAISON_SUPABASE_URL: "https://test.supabase.co",
        MAISON_SUPABASE_SERVICE_ROLE_KEY: "server-only",
      },
    },
    Buffer,
    URL,
    Response,
    Request,
    console,
    require: (n) =>
      n === "server-only"
        ? {}
        : n === "next/headers"
          ? {
              cookies: async () => ({
                get: () => (token ? { value: token } : undefined),
              }),
            }
          : n === "@supabase/supabase-js"
            ? { createClient: () => client }
            : require(n),
  });
  return exports;
}
const token = (aal = "aal2") =>
  "header." +
  Buffer.from(JSON.stringify({ aal, session_id: "session" })).toString(
    "base64url",
  ) +
  ".signature";
test("admin API rejects missing sessions, nonmembers, single-factor tokens and revoked sessions", async () => {
  for (const config of [
    {},
    { token: token(), user: { id: "u" } },
    { token: token("aal1"), user: { id: "u" }, member: { role: "owner" } },
    {
      token: token(),
      user: { id: "u" },
      member: { role: "owner" },
      session: false,
    },
  ])
    await assert.rejects(
      () => server(config).requireAdmin(),
      (e) => [401, 403].includes(e.status),
    );
});
test("viewers can read but cannot mutate; owners require live MFA sessions", async () => {
  const config = {
    token: token(),
    user: { id: "u", email: "owner@example.invalid" },
    member: { role: "viewer" },
  };
  assert.equal((await server(config).requireAdmin()).role, "viewer");
  await assert.rejects(
    () => server(config).requireAdmin(true),
    (e) => e.status === 403,
  );
  assert.equal(
    (await server({ ...config, member: { role: "owner" } }).requireAdmin(true))
      .role,
    "owner",
  );
});
test("cross-origin and missing-origin mutations are rejected", () => {
  const api = server();
  for (const origin of [undefined, "https://evil.example"])
    assert.throws(
      () =>
        api.sameOrigin(
          new Request("https://shop.example/api/admin/products", {
            headers: origin ? { origin } : {},
          }),
        ),
      (e) => e.status === 403,
    );
  assert.doesNotThrow(() =>
    api.sameOrigin(
      new Request("https://shop.example/api/admin/products", {
        headers: { origin: "https://shop.example" },
      }),
    ),
  );
});
test("body limits work with chunked requests without Content-Length", async () => {
  const api = server();
  await assert.rejects(
    () =>
      api.readJson(
        new Request("https://shop.example", {
          method: "POST",
          body: JSON.stringify({ large: "x".repeat(500) }),
        }),
        100,
      ),
    (e) => e.status === 413,
  );
});
