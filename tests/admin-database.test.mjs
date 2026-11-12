import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const id = "11111111-1111-4111-8111-111111111111",
  order = "22222222-2222-4222-8222-222222222222";
test("Postgres enforces private data, RPC privileges, stock transactions, audit and stale edits", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create table auth.sessions(id uuid,user_id uuid,not_after timestamptz);create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);alter default privileges in schema public grant all on tables to service_role;`,
    );
    for (const file of [
      "20261028_maison_store.sql",
      "20261103_maison_eft_orders.sql",
      "20261112110000_client_admin.sql",
    ])
      await db.exec(
        readFileSync(
          new URL("../supabase/migrations/" + file, import.meta.url),
          "utf8",
        ),
      );
    await db.exec(
      `insert into auth.users values('${id}');insert into public.maison_admins(user_id,role) values('${id}','owner');set role anon;`,
    );
    for (const sql of [
      "select * from public.maison_orders",
      "select * from public.maison_admins",
      `select public.maison_save_product('${id}','{}')`,
      `select public.maison_session_active('${id}','${id}')`,
    ])
      await assert.rejects(() => db.exec(sql), /permission denied/);
    await db.exec("reset role;set role service_role");
    const product = {
      slug: "test-piece",
      name: "Test",
      price: 60,
      status: "published",
      stock: { M: 2 },
    };
    await db.query("select public.maison_save_product($1,$2)", [
      id,
      JSON.stringify(product),
    ]);
    await assert.rejects(
      () =>
        db.query("select public.maison_save_product($1,$2)", [
          id,
          JSON.stringify(product),
        ]),
      /Product changed/,
    );
    await db.query(
      `insert into public.maison_orders(id,status,first_name,last_name,email,phone,address,city,province,postal_code,items,subtotal_cents,delivery_cents,total_cents) values($1,'awaiting_payment','TEST','ONLY','test@example.invalid','','','','','', $2,6000,0,6000)`,
      [order, JSON.stringify([{ slug: "test-piece", size: "M", quantity: 1 }])],
    );
    await assert.rejects(
      () =>
        db.query("select public.maison_transition_order($1,$2,$3,$4,$5)", [
          id,
          order,
          "awaiting_payment",
          "shipped",
          "courier",
        ]),
      /Invalid transition/,
    );
    await db.query("select public.maison_transition_order($1,$2,$3,$4,$5)", [
      id,
      order,
      "awaiting_payment",
      "paid",
      null,
    ]);
    assert.equal(
      (
        await db.query(
          "select stock->>'M' as stock from public.maison_products",
        )
      ).rows[0].stock,
      "1",
    );
    await assert.rejects(
      () =>
        db.query("select public.maison_transition_order($1,$2,$3,$4,$5)", [
          id,
          order,
          "awaiting_payment",
          "paid",
          null,
        ]),
      /Order changed/,
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from public.maison_audit where action='order.status'",
        )
      ).rows[0].n,
      1,
    );
    await db.exec(
      `update public.maison_orders set status='awaiting_payment',items='[{"slug":"test-piece","size":"M","quantity":3}]'`,
    );
    await assert.rejects(
      () =>
        db.query("select public.maison_transition_order($1,$2,$3,$4,$5)", [
          id,
          order,
          "awaiting_payment",
          "paid",
          null,
        ]),
      /Insufficient stock/,
    );
    assert.equal(
      (
        await db.query(
          "select stock->>'M' as stock from public.maison_products",
        )
      ).rows[0].stock,
      "1",
    );
    assert.equal(
      (await db.query("select status from public.maison_orders")).rows[0]
        .status,
      "awaiting_payment",
    );
    assert.equal(
      (
        await db.query("select public.maison_rate_limit($1,$2) as allowed", [
          "test",
          1,
        ])
      ).rows[0].allowed,
      true,
    );
    assert.equal(
      (
        await db.query("select public.maison_rate_limit($1,$2) as allowed", [
          "test",
          1,
        ])
      ).rows[0].allowed,
      false,
    );
  } finally {
    await db.close();
  }
});
