import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDeliveryFee } from '../src/data/products.ts';

const tee = { slug: 'emblem-tee', quantity: 1 };
const wheel = { slug: 'boat-floating-wheel', quantity: 1 };
for (const [name, items, expected] of [
  ['empty cart', [], 0],
  ['one tee', [tee], 0],
  ['multiple tees', [tee, { slug: 'automobile-tee', quantity: 3 }], 0],
  ['one boat wheel', [wheel], 4000],
  ['multiple boat wheels charged once', [{ ...wheel, quantity: 4 }], 4000],
  ['mixed cart charged once', [tee, wheel], 4000],
  ['removed boat wheel', [tee, { ...wheel, quantity: 0 }], 0],
]) {
  test(name, () => assert.equal(getDeliveryFee(items), expected));
}
