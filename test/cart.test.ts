import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  cartItems,
  cartCount,
  addToCart,
  setQty,
  removeFromCart,
  clearCart,
} from '../src/stores/cartStore.ts';
import { estimateFee, parcelKg, zoneById, shippingZones } from '../src/data/shipping.ts';
import { reviews, reviewSummary } from '../src/data/reviews.ts';

const base = {
  slug: 'kalyenoir-tee',
  title: 'KALYENOIR Tee',
  variant: 'Black / M',
  image: '/x.png',
};

test('cart: dedupe by sku, qty and removal', () => {
  clearCart();

  addToCart({ ...base, sku: 'a', qty: 1 });
  addToCart({ ...base, sku: 'a', qty: 1 }); // same sku merges into qty 2
  addToCart({ ...base, sku: 'b', variant: 'Black / L', qty: 3 });

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

test('shipping: fee by zone and parcel weight', () => {
  // 0.3 kg per tee, billed per whole kg
  assert.equal(parcelKg(1), 1, 'one tee bills 1 kg');
  assert.equal(parcelKg(4), 2, '1.2 kg rounds up to 2 kg');
  assert.equal(parcelKg(10), 3, '10 tees are exactly 3 kg, not 4');

  const ncr = zoneById('ncr')!;
  assert.equal(estimateFee('ncr', 1), ncr.firstKg);
  assert.equal(estimateFee('ncr', 4), ncr.firstKg + ncr.perKg);

  // nearer zones must never cost more than farther ones
  const rates = shippingZones.map((z) => z.firstKg);
  assert.deepEqual(rates, [...rates].sort((a, b) => a - b), 'zones priced near → far');

  assert.equal(estimateFee('ncr', 0), null, 'empty cart has no fee');
  assert.equal(estimateFee('nope', 3), null, 'unknown zone has no fee');
});

test('review wall: quiet when empty, averages and collects photos when full', () => {
  assert.deepEqual(reviewSummary(), { count: 0, stars: 0, photoReviews: [] });

  const entry = { body: '', date: '2026-01-01' };
  reviews.push(
    { ...entry, id: 'a', name: 'Ana', rating: 5, product: 'MEDUSA Tee', photo: '/a.jpg' },
    { ...entry, id: 'b', name: 'Ben', rating: 4, product: 'MANILA Tee' },
    { ...entry, id: 'c', name: 'Cai', rating: 4, product: 'KALYENOIR Tee' }
  );

  const filled = reviewSummary();
  assert.equal(filled.count, 3);
  assert.equal(filled.stars, 4, '4.33 averages to 4 stars');
  assert.equal(filled.photoReviews.length, 1, 'only photo entries reach the wall');

  reviews.length = 0;
  assert.equal(reviewSummary().count, 0, 'clearing them empties the wall again');
});
