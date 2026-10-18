import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  cartItems,
  cartCount,
  addToCart,
  setQty,
  stepQty,
  removeFromCart,
  clearCart,
} from '../src/stores/cartStore.ts';
import { shippingZones, zoneById } from '../src/data/shipping.ts';
import { findVariant, products } from '../src/data/catalog.ts';

const base = {
  slug: 'kalyenoir-tee',
  title: 'KALYENOIR Tee',
  variant: 'Black · M',
};

test('cart: dedupe by sku, qty and removal', () => {
  clearCart();

  addToCart({ ...base, sku: 'a', qty: 1 });
  addToCart({ ...base, sku: 'a', qty: 1 }); // same sku merges into qty 2
  addToCart({ ...base, sku: 'b', variant: 'Black · L', qty: 3 });

  assert.equal(cartItems.get().length, 2, 'two distinct lines');
  assert.equal(cartCount.get(), 5, '2 + 3 items');

  setQty('a', 1);
  assert.equal(cartCount.get(), 4);

  setQty('a', 0); // zero removes the line
  assert.equal(
    cartItems.get().find((i) => i.sku === 'a'),
    undefined
  );

  removeFromCart('b');
  assert.equal(cartItems.get().length, 0);
});

test('cart: the stepper moves a line, and ignores skus not in the cart', () => {
  clearCart();
  addToCart({ ...base, sku: 'a', qty: 2 });

  stepQty('a', 1);
  stepQty('ghost', 1);

  assert.equal(cartCount.get(), 3, 'only the real line moved');
});

test('shipping: every province maps to exactly one zone', () => {
  assert.equal(zoneById('ncr')?.label, 'Metro Manila');
  assert.equal(zoneById('nope'), undefined, 'unknown zone resolves to nothing');

  const provinces = shippingZones.flatMap((z) => z.provinces);
  assert.equal(
    new Set(provinces).size,
    provinces.length,
    'no province may sit in two zones'
  );
});

test('catalog: every tee sells five sizes, and only five', () => {
  assert.equal(products.length, 3, 'three prints');

  for (const product of products) {
    assert.equal(product.variants.length, 5, `${product.slug} spans S–2XL`);
    assert.ok(findVariant(product.slug, '2XL'), `${product.slug} has a 2XL`);
    assert.equal(findVariant(product.slug, 'XXXL'), undefined, 'no invented sizes');
  }
});
