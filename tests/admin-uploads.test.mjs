import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import sharp from "sharp";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function route(allowed = true) {
  const exports = {};
  let stored;
  vm.runInNewContext(
    ts.transpileModule(
      readFileSync(
        new URL("../src/app/api/admin/uploads/route.ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          esModuleInterop: true,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      Buffer,
      require: (n) =>
        n === "@/lib/admin/server"
          ? {
              HttpError,
              mutate: async () => {
                if (!allowed) throw new HttpError(401, "Sign in");
                return { id: "owner" };
              },
              reply: (data) => Response.json(data),
              failure: (e) =>
                Response.json(
                  { error: e.message },
                  { status: e.status || 503 },
                ),
              db: () => ({
                storage: {
                  from: () => ({
                    upload: async (path, body, options) => {
                      stored = { path, body, options };
                      return { error: null };
                    },
                    getPublicUrl: (path) => ({
                      data: { publicUrl: "https://test.supabase.co/" + path },
                    }),
                  }),
                },
              }),
            }
          : require(n),
    },
  );
  return {
    POST: exports.POST,
    get stored() {
      return stored;
    },
  };
}
test("uploads reject unauthorised access and SVG content", async () => {
  let run = route(false);
  assert.equal(
    (
      await run.POST(
        new Request("https://shop.example", { method: "POST", body: "fake" }),
      )
    ).status,
    401,
  );
  run = route();
  assert.equal(
    (
      await run.POST(
        new Request("https://shop.example", {
          method: "POST",
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>',
        }),
      )
    ).status,
    400,
  );
  assert.equal(run.stored, undefined);
});
test("valid photographs are re-encoded and stored under an owner-scoped random name", async () => {
  const input = await sharp({
    create: { width: 10, height: 10, channels: 4, background: "red" },
  })
    .png()
    .toBuffer();
  const run = route();
  assert.equal(
    (
      await run.POST(
        new Request("https://shop.example", { method: "POST", body: input }),
      )
    ).status,
    200,
  );
  assert.match(run.stored.path, /^owner\/[0-9a-f-]+\.webp$/);
  assert.equal(run.stored.options.contentType, "image/webp");
  assert.equal((await sharp(run.stored.body).metadata()).format, "webp");
});
test("uploads reject oversized chunked bodies without trusting Content-Length", async () => {
  const run = route();
  assert.equal(
    (
      await run.POST(
        new Request("https://shop.example", {
          method: "POST",
          body: Buffer.alloc(8 * 1024 * 1024 + 1),
        }),
      )
    ).status,
    413,
  );
  assert.equal(run.stored, undefined);
});
