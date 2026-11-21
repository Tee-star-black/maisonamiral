import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { products, getDeliveryFee } from "../src/data/products.ts";

const slug = "flagship-beanie-safety-headwear";

test("Flagship Beanie has the requested price, Bloody Red colour and three images", () => {
  const product = products.find((item) => item.slug === slug);
  assert.ok(product, "Flagship Beanie must exist in the catalogue");
  assert.equal(product.price, 200);
  assert.equal(product.colour, "Bloody Red");
  assert.equal(product.category, "accessory");
  assert.equal(product.images.length, 3);
  assert.equal(product.imageLabels.length, 3);
  for (const image of product.images) {
    assert.ok(existsSync(new URL("../public" + image, import.meta.url)), "Missing product image: " + image);
  }
});

test("Flagship Beanie delivery is free unless an order also contains the Boat Floating Wheel", () => {
  assert.equal(getDeliveryFee([{ slug, quantity: 1 }]), 0);
  assert.equal(getDeliveryFee([{ slug, quantity: 1 }, { slug: "boat-floating-wheel", quantity: 1 }]), 4000);
});

test("Flagship Beanie leads the catalogue and the yellow NEW ITEM ADDED campaign", () => {
  assert.equal(products[0].slug, slug, "The newest item should appear first");
  const home = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  const shop = readFileSync(new URL("../src/app/shop/page.tsx", import.meta.url), "utf8");
  const shopStyles = readFileSync(new URL("../src/app/shop/shop.module.css", import.meta.url), "utf8");
  const homeStyles = readFileSync(new URL("../src/app/home.module.css", import.meta.url), "utf8");
  assert.ok(home.includes("NEW ITEM ADDED / FLAGSHIP BEANIE"));
  assert.ok(home.includes('href="/shop/flagship-beanie-safety-headwear"'));
  assert.ok(home.indexOf("flagship-drop-heading") < home.indexOf("redline-drop-heading"));
  assert.ok(home.includes("PREVIOUS DROP / REDLINE SERIES 001"));
  assert.ok(shop.includes("NEW ITEM ADDED"));
  assert.ok(shopStyles.includes(".flagshipNewBadge"));
  assert.ok(shopStyles.includes("#ffd600"));
  assert.ok(homeStyles.includes(".flagshipDrop"));
});
