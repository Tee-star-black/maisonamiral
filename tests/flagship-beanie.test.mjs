import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync } from "node:fs";
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
