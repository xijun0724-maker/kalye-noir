import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
	parseOrderSubmission,
	PAYMENT_SLIP_MAX_BYTES,
	type OrderSubmission,
} from '../src/lib/orderSubmission.ts';
import { createSubmitOrderHandler } from '../netlify/functions/submit-order.mts';

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

test('orders: totals and product details are recalculated from catalog and province data', async () => {
	const formData = validFormData();
	formData.set(
		'cart-items',
		JSON.stringify([
			{
				sku: 'kalyenoir-tee-m',
				qty: 1,
				title: '<script>ignored</script>',
				price: 1,
			},
			{ sku: 'kalyenoir-tee-m', qty: 1 },
			{ sku: 'medusa-tee-l', qty: 2 },
		]),
	);
	formData.set('subtotal', '₱1');
	formData.set('grand-total', '₱1');

	const result = await parseOrderSubmission(formData);

	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.order.lines.length, 2);
	assert.equal(result.order.lines[0].title, 'KALYENOIR Tee');
	assert.equal(result.order.lines[0].quantity, 2);
	assert.equal(result.order.itemCount, 4);
	assert.equal(result.order.subtotal, 1300);
	assert.equal(result.order.shippingFee, 0);
	assert.equal(result.order.grandTotal, 1300);
	assert.equal(
		result.order.deliveryWindow,
		'Delivery Parcel Express · Metro Manila · 1 – 3 business days',
	);
});

test('orders: rejects unknown products, invalid province, and invalid payment references', async () => {
	const unknownProduct = validFormData();
	unknownProduct.set(
		'cart-items',
		JSON.stringify([{ sku: 'forged-shirt', qty: 1 }]),
	);
	const unknownProductResult = await parseOrderSubmission(unknownProduct);
	assert.equal(unknownProductResult.ok, false);
	if (!unknownProductResult.ok)
		assert.match(unknownProductResult.message, /no longer available/);

	const invalidProvince = validFormData();
	invalidProvince.set('province', 'Somewhere');
	const invalidProvinceResult = await parseOrderSubmission(invalidProvince);
	assert.equal(invalidProvinceResult.ok, false);
	if (!invalidProvinceResult.ok)
		assert.match(invalidProvinceResult.message, /valid delivery province/);

	const invalidReference = validFormData();
	invalidReference.set('payment-type', 'gcash');
	invalidReference.set('payment-ref', '123');
	const invalidReferenceResult = await parseOrderSubmission(invalidReference);
	assert.equal(invalidReferenceResult.ok, false);
	if (!invalidReferenceResult.ok)
		assert.match(invalidReferenceResult.message, /13-digit/);
});

test('orders: validates receipt size and file signature before accepting an attachment', async () => {
	const oversized = validFormData();
	oversized.set(
		'payment-slip',
		new File([new Uint8Array(PAYMENT_SLIP_MAX_BYTES + 1)], 'receipt.png', {
			type: 'image/png',
		}),
	);
	const oversizedResult = await parseOrderSubmission(oversized);
	assert.equal(oversizedResult.ok, false);
	if (!oversizedResult.ok) assert.equal(oversizedResult.status, 413);

	const mislabeled = validFormData();
	mislabeled.set(
		'payment-slip',
		new File(['not a PDF'], 'receipt.pdf', { type: 'application/pdf' }),
	);
	const mislabeledResult = await parseOrderSubmission(mislabeled);
	assert.equal(mislabeledResult.ok, false);
	if (!mislabeledResult.ok)
		assert.match(mislabeledResult.message, /does not match/);

	const validReceipt = validFormData();
	validReceipt.set(
		'payment-slip',
		new File(['%PDF-1.7\n'], 'receipt.pdf', { type: 'application/pdf' }),
	);
	const validReceiptResult = await parseOrderSubmission(validReceipt);
	assert.equal(validReceiptResult.ok, true);
	if (validReceiptResult.ok)
		assert.equal(validReceiptResult.order.paymentSlip?.type, 'application/pdf');

	const maximumSizeBytes = new Uint8Array(PAYMENT_SLIP_MAX_BYTES);
	maximumSizeBytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const maximumSize = validFormData();
	maximumSize.set(
		'payment-slip',
		new File([maximumSizeBytes], 'receipt.png', { type: 'image/png' }),
	);
	const maximumSizeResult = await parseOrderSubmission(maximumSize);
	assert.equal(maximumSizeResult.ok, true, 'the 4 MB limit is inclusive');
});

test('orders: only redirects after both emails are accepted', async () => {
	const sentOrders: OrderSubmission[] = [];
	const handler = createSubmitOrderHandler(async order => {
		sentOrders.push(order);
	});
	const response = await handler(makeRequest(validFormData()));

	assert.equal(response.status, 303);
	assert.equal(
		response.headers.get('location'),
		'https://kalyenoir.test/order-thank-you',
	);
	assert.equal(sentOrders.length, 1);
});

test('orders: email failures and cross-origin requests never produce a success redirect', async () => {
	const handler = createSubmitOrderHandler(async () => {
		throw new Error('SMTP unavailable');
	});
	const failedDelivery = await handler(makeRequest(validFormData()));
	assert.equal(failedDelivery.status, 502);
	assert.match(
		(await failedDelivery.json()).message,
		/could not deliver your order email/,
	);

	const crossOrigin = await handler(
		makeRequest(validFormData(), { origin: 'https://attacker.test' }),
	);
	assert.equal(crossOrigin.status, 403);
});
