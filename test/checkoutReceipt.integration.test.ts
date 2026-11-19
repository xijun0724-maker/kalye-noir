import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSubmitOrderHandler,
} from '../netlify/functions/submit-order.mts';
import type { OrderSubmission } from '../src/lib/orderSubmission.ts';

function validFormData(): FormData {
  const formData = new FormData();
  formData.set('name', 'Juan dela Cruz');
  formData.set('email', 'juan@example.com');
  formData.set('phone', '09171234567');
  formData.set('street', '123 Kalye St., Barangay 1');
  formData.set('city', 'Manila');
  formData.set('province', 'Manila');
  formData.set('zip', '1000');
  formData.set('payment-type', 'cod');
  formData.set('payment-ref', '');
  formData.set(
    'cart-items',
    JSON.stringify([{ sku: 'kalyenoir-tee-m', qty: 1 }]),
  );
  return formData;
}

function makeRequest(formData: FormData, headers: HeadersInit = {}) {
  return new Request('https://kalyenoir.test/.netlify/functions/submit-order', {
    method: 'POST',
    headers,
    body: formData,
  });
}

function pngReceipt(signatureOnly = false): File {
  // Real PNG file signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  const sig = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const body = signatureOnly ? sig : new Uint8Array([...sig, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
  return new File([body], 'receipt.png', { type: 'image/png' });
}

function webpReceipt(): File {
  // Real WebP signature: RIFF....WEBP
  const sig = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ]);
  return new File([sig], 'receipt.webp', { type: 'image/webp' });
}

function pdfReceipt(body: string | Uint8Array): File {
  return new File([body], 'receipt.pdf', { type: 'application/pdf' });
}

/** Per-test mail mock. Each test creates its own so parallel runs do not race. */
function mockMail() {
  let order: OrderSubmission | null = null;
  let reference = '';
  const sendOrderEmails = async (
    capturedOrder: OrderSubmission,
    orderReference: string,
  ) => {
    order = capturedOrder;
    reference = orderReference;
  };
  return { sendOrderEmails, get order() { return order; }, get reference() { return reference; } };
}

test('checkout: a real PNG receipt is attached and the order redirects to the thank-you page', async () => {
  const mail = mockMail();
  const handler = createSubmitOrderHandler(mail.sendOrderEmails);
  const formData = validFormData();
  formData.set('payment-slip', pngReceipt());

  const response = await handler(makeRequest(formData));

  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get('location'),
    'https://kalyenoir.test/order-thank-you',
  );
  assert.ok(mail.order);
  assert.ok(mail.order.paymentSlip);
  assert.equal(mail.order.paymentSlip.type, 'image/png');
  assert.equal(mail.order.paymentSlip.name, 'receipt.png');
});

test('checkout: a real WebP receipt is accepted with the correct attachment type', async () => {
  const mail = mockMail();
  const handler = createSubmitOrderHandler(mail.sendOrderEmails);
  const formData = validFormData();
  formData.set('payment-slip', webpReceipt());

  const response = await handler(makeRequest(formData));

  assert.equal(response.status, 303);
  assert.ok(mail.order);
  assert.ok(mail.order.paymentSlip);
  assert.equal(mail.order.paymentSlip.type, 'image/webp');
  assert.equal(mail.order.paymentSlip.name, 'receipt.webp');
});

test('checkout: a receipt whose bytes do not match its declared file type is rejected', async () => {
  const mail = mockMail();
  const handler = createSubmitOrderHandler(mail.sendOrderEmails);
  const formData = validFormData();
  // A PNG-signature buffer delivered as a PDF is not a PDF.
  formData.set('payment-slip', pdfReceipt(pngReceipt(true)));

  const response = await handler(makeRequest(formData));

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.match(payload.message, /does not match/);
  assert.equal(mail.order, null);
});

test('checkout: a PDF receipt is attached as payment-receipt.pdf', async () => {
  const mail = mockMail();
  const handler = createSubmitOrderHandler(mail.sendOrderEmails);
  const formData = validFormData();
  formData.set('payment-slip', pdfReceipt('%PDF-1.7\n'));

  const response = await handler(makeRequest(formData));

  assert.equal(response.status, 303);
  assert.ok(mail.order);
  assert.ok(mail.order.paymentSlip);
  assert.equal(mail.order.paymentSlip.type, 'application/pdf');
  assert.equal(mail.order.paymentSlip.name, 'receipt.pdf');
});

test('checkout: an oversized receipt is rejected with the size message', async () => {
  const mail = mockMail();
  const handler = createSubmitOrderHandler(mail.sendOrderEmails);
  const formData = validFormData();
  formData.set(
    'payment-slip',
    new File(
      [new Uint8Array(4 * 1024 * 1024 + 1)],
      'receipt.png',
      { type: 'image/png' },
    ),
  );

  const response = await handler(makeRequest(formData));

  assert.equal(response.status, 413);
  const payload = await response.json();
  assert.match(payload.message, /4 MB or smaller/);
  assert.equal(mail.order, null);
});

test('checkout: the cart line, totals and shipping are reflected in the captured order', async () => {
  const mail = mockMail();
  const handler = createSubmitOrderHandler(mail.sendOrderEmails);
  const formData = validFormData();
  formData.set(
    'cart-items',
    JSON.stringify([
      { sku: 'kalyenoir-tee-m', qty: 1 },
      { sku: 'medusa-tee-l', qty: 2 },
    ]),
  );
  formData.set('payment-slip', pngReceipt());

  const response = await handler(makeRequest(formData));

  assert.equal(response.status, 303);
  assert.ok(mail.order);
  assert.equal(mail.order.lines.length, 2);
  assert.equal(mail.order.itemCount, 3);
  assert.equal(mail.order.subtotal, 975);
  assert.equal(mail.order.shippingFee, 0);
  assert.equal(mail.order.grandTotal, 975);
  assert.match(
    mail.order.deliveryWindow,
    /Delivery Parcel Express .* Metro Manila/,
  );
});
