import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { zoomOrigin } from '../src/lib/zoom.ts';

const frame = { left: 100, top: 50, width: 800, height: 1000 };

test('zoom: a pointer maps onto origin percentages inside the frame', () => {
  assert.deepEqual(zoomOrigin(frame, 300, 300), { x: 25, y: 25 });
});

test('zoom: the origin stays inside the frame when the pointer strays outside it', () => {
  assert.deepEqual(zoomOrigin(frame, 1000, -50), { x: 100, y: 0 });
});
