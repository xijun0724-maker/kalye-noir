import { test, describe, vi } from 'vitest';
import { strict as assert } from 'node:assert';
import {
	parseOrderSubmission,
	PAYMENT_SLIP_MAX_BYTES,
	formatOrderDetails,
} from 'kalye-noir-shared/validation';
import type { OrderSubmission } from 'kalye-noir-shared/validation';

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

function pngReceipt(signatureOnly = false): File {
	// Real PNG file signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
	const sig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const body = signatureOnly
		? sig
		: new Uint8Array([...sig, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
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

describe('parseOrderSubmission', () => {
	test('totals and product details are recalculated from catalog and province data', async () => {
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

		const result = await parseOrderSubmission(formData);

		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.equal(result.order.lines.length, 2);
		assert.equal(result.order.lines[0].title, 'KALYENOIR Tee');
		assert.equal(result.order.lines[0].quantity, 2);
		assert.equal(result.order.itemCount, 4);
		assert.equal(result.order.subtotal, 1012);
		assert.equal(result.order.shippingFee, 0);
		assert.equal(result.order.grandTotal, 1012);
		assert.equal(
			result.order.deliveryWindow,
			'Delivery Parcel Express · Metro Manila · 1 – 3 business days',
		);
	});

	test('rejects unknown products, invalid province, and invalid payment references', async () => {
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

	test('validates receipt size and file signature before accepting an attachment', async () => {
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
			assert.equal(
				validReceiptResult.order.paymentSlip?.type,
				'application/pdf',
			);
	});

	test('accepts a maximum-size PNG receipt at the 4 MB boundary', async () => {
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

	test('a real PNG receipt is accepted with correct attachment type', async () => {
		const formData = validFormData();
		formData.set('payment-slip', pngReceipt());

		const result = await parseOrderSubmission(formData);

		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.ok(result.order.paymentSlip);
		assert.equal(result.order.paymentSlip.type, 'image/png');
		assert.equal(result.order.paymentSlip.name, 'receipt.png');
	});

	test('a real WebP receipt is accepted with the correct attachment type', async () => {
		const formData = validFormData();
		formData.set('payment-slip', webpReceipt());

		const result = await parseOrderSubmission(formData);

		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.ok(result.order.paymentSlip);
		assert.equal(result.order.paymentSlip.type, 'image/webp');
		assert.equal(result.order.paymentSlip.name, 'receipt.webp');
	});

	test('a receipt whose bytes do not match its declared file type is rejected', async () => {
		const formData = validFormData();
		// A PNG-signature buffer delivered as a PDF is not a PDF.
		formData.set('payment-slip', pdfReceipt(pngReceipt(true)));

		const result = await parseOrderSubmission(formData);

		assert.equal(result.ok, false);
		if (!result.ok) {
			assert.equal(result.status, 400);
			assert.match(result.message, /does not match/);
		}
	});

	test('a PDF receipt is accepted', async () => {
		const formData = validFormData();
		formData.set('payment-slip', pdfReceipt('%PDF-1.7\n'));

		const result = await parseOrderSubmission(formData);

		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.ok(result.order.paymentSlip);
		assert.equal(result.order.paymentSlip.type, 'application/pdf');
		assert.equal(result.order.paymentSlip.name, 'receipt.pdf');
	});

	test('an oversized receipt is rejected with the size message', async () => {
		const formData = validFormData();
		formData.set(
			'payment-slip',
			new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'receipt.png', {
				type: 'image/png',
			}),
		);

		const result = await parseOrderSubmission(formData);

		assert.equal(result.ok, false);
		if (!result.ok) {
			assert.equal(result.status, 413);
			assert.match(result.message, /4 MB or smaller/);
		}
	});

	test('the cart line, totals and shipping are reflected in the captured order', async () => {
		const formData = validFormData();
		formData.set(
			'cart-items',
			JSON.stringify([
				{ sku: 'kalyenoir-tee-m', qty: 1 },
				{ sku: 'medusa-tee-l', qty: 2 },
			]),
		);
		formData.set('payment-slip', pngReceipt());

		const result = await parseOrderSubmission(formData);

		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.equal(result.order.lines.length, 2);
		assert.equal(result.order.itemCount, 3);
		assert.equal(result.order.subtotal, 759);
		assert.equal(result.order.shippingFee, 0);
		assert.equal(result.order.grandTotal, 759);
		assert.match(
			result.order.deliveryWindow,
			/Delivery Parcel Express .* Metro Manila/,
		);
	});
});

describe('formatOrderDetails', () => {
	test('formats order details as human-readable text', () => {
		const order: OrderSubmission = {
			customer: {
				name: 'Juan dela Cruz',
				email: 'juan@example.com',
				phone: '09171234567',
				street: '123 Kalye St., Barangay 1',
				city: 'Manila',
				province: 'Manila',
				zip: '1000',
				note: 'Leave at gate',
			},
			lines: [
				{
					title: 'KALYENOIR Tee',
					variant: 'Black · M',
					quantity: 2,
					unitPrice: 253,
				},
				{
					title: 'MEDUSA Tee',
					variant: 'Black · L',
					quantity: 1,
					unitPrice: 253,
				},
			],
			itemCount: 3,
			paymentMethod: 'cod',
			paymentReference: '',
			deliveryWindow:
				'Delivery Parcel Express · Metro Manila · 1 – 3 business days',
			subtotal: 759,
			shippingFee: 0,
			grandTotal: 759,
		};

		const formatted = formatOrderDetails(order, 'ABC123');

		assert.ok(formatted.includes('Order reference: ABC123'));
		assert.ok(formatted.includes('ITEMS'));
		assert.ok(formatted.includes('2× KALYENOIR Tee (Black · M)'));
		assert.ok(formatted.includes('1× MEDUSA Tee (Black · L)'));
		assert.ok(formatted.includes('Subtotal:     ₱759'));
		assert.ok(formatted.includes('Delivery fee: FREE'));
		assert.ok(formatted.includes('Total:        ₱759'));
		assert.ok(formatted.includes('Payment: Cash on Delivery (COD)'));
		assert.ok(formatted.includes('DELIVER TO'));
		assert.ok(formatted.includes('Juan dela Cruz'));
		assert.ok(formatted.includes('123 Kalye St., Barangay 1'));
		assert.ok(formatted.includes('Manila, Manila, 1000'));
		assert.ok(formatted.includes('Mobile: 09171234567'));
		assert.ok(formatted.includes('NOTE'));
		assert.ok(formatted.includes('Leave at gate'));
	});

	test('formats GCash payment with reference number', () => {
		const order: OrderSubmission = {
			customer: {
				name: 'Test User',
				email: 'test@example.com',
				phone: '09171234567',
				street: '456 Test St.',
				city: 'Quezon City',
				province: 'Quezon City',
				zip: '1100',
				note: '',
			},
			lines: [
				{
					title: 'KALYENOIR Tee',
					variant: 'Black · S',
					quantity: 1,
					unitPrice: 253,
				},
			],
			itemCount: 1,
			paymentMethod: 'gcash',
			paymentReference: '1234567890123',
			deliveryWindow:
				'Delivery Parcel Express · Metro Manila · 1 – 3 business days',
			subtotal: 253,
			shippingFee: 100,
			grandTotal: 353,
		};

		const formatted = formatOrderDetails(order, 'XYZ789');

		assert.ok(formatted.includes('Payment: GCash / Maya manual transfer'));
		assert.ok(formatted.includes('Reference no.: 1234567890123'));
		assert.ok(formatted.includes('Subtotal:     ₱253'));
		assert.ok(formatted.includes('Delivery fee: ₱100'));
		assert.ok(formatted.includes('Total:        ₱353'));
	});
});
