import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { Resend } from 'resend';
import {
	parseOrderSubmission,
	PAYMENT_SLIP_MAX_BYTES,
	type OrderSubmission,
} from '../src/lib/orderSubmission.ts';
import {
	createSendOrderEmails,
	createSubmitOrderHandler,
} from '../netlify/functions/submit-order.mts';

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

test('orders: accepts Resend SDK success responses and emails the store and customer', async t => {
	const resend = new Resend('unused');
	const send = t.mock.method(resend.emails, 'send', async () => ({
		data: { id: 'accepted-email' },
		error: null,
	}));
	const handler = createSubmitOrderHandler(
		createSendOrderEmails(resend, 'KALYE NOIR <orders@example.com>'),
	);
	const formData = validFormData();
	formData.set('payment-type', 'gcash');
	formData.set('payment-ref', '1234567890123');
	formData.set(
		'payment-slip',
		new File(['%PDF-1.7\n'], 'upload.pdf', { type: 'application/pdf' }),
	);

	const response = await handler(makeRequest(formData));

	assert.equal(response.status, 303);
	assert.equal(send.mock.callCount(), 2);
	const [storeEmail, customerEmail] = send.mock.calls.map(
		call => call.arguments[0],
	);
	assert.equal(storeEmail.to, 'kalyenoirorders@gmail.com');
	assert.equal(storeEmail.replyTo, 'juan@example.com');
	assert.equal(customerEmail.to, 'juan@example.com');
	assert.equal(customerEmail.replyTo, 'kalyenoirorders@gmail.com');
	assert.equal(storeEmail.from, 'KALYE NOIR <orders@example.com>');
	assert.equal(customerEmail.from, storeEmail.from);
	const reference = storeEmail.subject.match(/New order ([A-F0-9-]+)/)?.[1];
	assert.ok(reference);
	assert.ok(customerEmail.subject.includes(reference));
	for (const email of [storeEmail, customerEmail]) {
		assert.match(email.text, /KALYENOIR Tee/);
		assert.match(email.text, /Total: +₱425/);
		assert.match(email.text, /1234567890123/);
		assert.match(email.text, /123 Kalye St/);
	}
	assert.match(customerEmail.text, /not a payment confirmation/);
	assert.equal(storeEmail.attachments.length, 1);
	assert.equal(storeEmail.attachments[0].filename, 'payment-receipt.pdf');
	assert.equal(storeEmail.attachments[0].contentType, 'application/pdf');
	assert.equal(storeEmail.attachments[0].content.toString(), '%PDF-1.7\n');
	assert.equal(customerEmail.attachments, undefined);
});

for (const failedRecipient of ['store', 'customer']) {
	test(`orders: a Resend error for the ${failedRecipient} prevents confirmation`, async t => {
		const resend = new Resend('unused');
		const send = t.mock.method(resend.emails, 'send', async email => {
			const isStore = email.to === 'kalyenoirorders@gmail.com';
			return isStore === (failedRecipient === 'store')
				? {
						data: null,
						error: { name: 'validation_error', message: 'Rejected recipient' },
					}
				: { data: { id: 'accepted-email' }, error: null };
		});
		const handler = createSubmitOrderHandler(
			createSendOrderEmails(resend, 'orders@example.com'),
		);

		const response = await handler(makeRequest(validFormData()));

		assert.equal(send.mock.callCount(), 2);
		assert.equal(response.status, 502);
		assert.equal(response.headers.get('location'), null);
		assert.match((await response.json()).message, /order was not confirmed/);
	});
}

test('orders: waits for both sends when Resend throws a network error', async t => {
	const resend = new Resend('unused');
	let releaseCustomer: () => void = () => {};
	const customerPending = new Promise<void>(resolve => {
		releaseCustomer = resolve;
	});
	let customerSettled = false;
	t.mock.method(resend.emails, 'send', async email => {
		if (email.to === 'kalyenoirorders@gmail.com') {
			throw new Error('Network unavailable');
		}
		await customerPending;
		customerSettled = true;
		return { data: { id: 'accepted-email' }, error: null };
	});
	const parsed = await parseOrderSubmission(validFormData());
	assert.ok(parsed.ok);
	let completed = false;
	const sending = createSendOrderEmails(resend, 'orders@example.com')(
		parsed.order,
		'ORDER-TEST',
	).finally(() => {
		completed = true;
	});
	const rejected = assert.rejects(sending, /did not accept both order emails/);
	await new Promise(resolve => setImmediate(resolve));
	assert.equal(completed, false);
	releaseCustomer();
	await rejected;
	assert.equal(customerSettled, true);
});

test('orders: an SDK response without a message ID does not confirm the order', async t => {
	const resend = new Resend('unused');
	t.mock.method(resend.emails, 'send', async () => ({
		data: null,
		error: null,
	}));
	const handler = createSubmitOrderHandler(
		createSendOrderEmails(resend, 'orders@example.com'),
	);

	const response = await handler(makeRequest(validFormData()));

	assert.equal(response.status, 502);
	assert.equal(response.headers.get('location'), null);
});
