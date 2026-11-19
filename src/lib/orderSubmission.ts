import { products } from '../data/catalog.ts';
import {
	calculateShippingFee,
	courier,
	shippingZones,
} from '../data/shipping.ts';

export const PAYMENT_SLIP_MAX_BYTES = 4 * 1024 * 1024;
export const ORDER_REQUEST_MAX_BYTES = PAYMENT_SLIP_MAX_BYTES + 1024 * 1024;

const paymentSlipTypes = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'application/pdf',
]);
const variantsBySku = new Map(
	products.flatMap(product =>
		product.variants.map(variant => [variant.sku, { product, variant }]),
	),
);

export interface OrderLine {
	title: string;
	variant: string;
	quantity: number;
	unitPrice: number;
}

export interface OrderSubmission {
	customer: {
		name: string;
		email: string;
		phone: string;
		street: string;
		city: string;
		province: string;
		zip: string;
		note: string;
	};
	lines: OrderLine[];
	itemCount: number;
	paymentMethod: 'cod' | 'gcash';
	paymentReference: string;
	paymentSlip?: File;
	deliveryWindow: string;
	subtotal: number;
	shippingFee: number;
	grandTotal: number;
}

export type OrderSubmissionResult =
	| { ok: true; order: OrderSubmission }
	| { ok: false; status: 400 | 413; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(
	formData: FormData,
	name: string,
	maxLength: number,
	required = true,
): string | null {
	const raw = formData.get(name);
	if (raw === null && !required) return '';
	if (typeof raw !== 'string') return null;

	const value = raw.trim();
	if ((required && !value) || value.length > maxLength) return null;
	if (name !== 'note' && /[\r\n]/.test(value)) return null;
	if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) return null;
	return value;
}

function invalid(
	message: string,
	status: 400 | 413 = 400,
): OrderSubmissionResult {
	return { ok: false, status, message };
}

async function validatePaymentSlip(
	formData: FormData,
): Promise<
	{ ok: true; file?: File } | { ok: false; status: 400 | 413; message: string }
> {
	const entry = formData.get('payment-slip');
	if (
		entry === null ||
		(typeof entry !== 'string' && entry.size === 0 && !entry.name)
	) {
		return { ok: true };
	}
	if (typeof entry === 'string') {
		return entry
			? {
					ok: false,
					status: 400,
					message: 'Attach a JPG, PNG, WebP, or PDF receipt.',
				}
			: { ok: true };
	}
	if (entry.size > PAYMENT_SLIP_MAX_BYTES) {
		return {
			ok: false,
			status: 413,
			message: 'Receipt files must be 4 MB or smaller.',
		};
	}
	if (!paymentSlipTypes.has(entry.type)) {
		return {
			ok: false,
			status: 400,
			message: 'Attach a JPG, PNG, WebP, or PDF receipt.',
		};
	}

	let header: Uint8Array;
	try {
		header = new Uint8Array(await entry.slice(0, 12).arrayBuffer());
	} catch {
		return {
			ok: false,
			status: 400,
			message: 'The receipt file could not be read. Choose it again.',
		};
	}
	const signature = String.fromCharCode(...header);
	const validSignature =
		(entry.type === 'application/pdf' && signature.startsWith('%PDF-')) ||
		(entry.type === 'image/jpeg' &&
			header[0] === 0xff &&
			header[1] === 0xd8 &&
			header[2] === 0xff) ||
		(entry.type === 'image/png' &&
			header.length >= 8 &&
			header[0] === 0x89 &&
			signature.slice(1, 4) === 'PNG' &&
			header[4] === 0x0d &&
			header[5] === 0x0a &&
			header[6] === 0x1a &&
			header[7] === 0x0a) ||
		(entry.type === 'image/webp' &&
			signature.slice(0, 4) === 'RIFF' &&
			signature.slice(8, 12) === 'WEBP');

	return validSignature
		? { ok: true, file: entry }
		: {
				ok: false,
				status: 400,
				message: 'The receipt file does not match its selected file type.',
			};
}

export async function parseOrderSubmission(
	formData: FormData,
): Promise<OrderSubmissionResult> {
	const honeypot = formData.get('website');
	if (honeypot !== null && (typeof honeypot !== 'string' || honeypot.trim())) {
		return invalid('The order request could not be verified.');
	}

	const name = readText(formData, 'name', 100);
	const email = readText(formData, 'email', 254);
	const phone = readText(formData, 'phone', 16);
	const street = readText(formData, 'street', 200);
	const city = readText(formData, 'city', 100);
	const province = readText(formData, 'province', 100);
	const zip = readText(formData, 'zip', 4);
	const note = readText(formData, 'note', 500, false);

	if (
		!name ||
		!email ||
		!phone ||
		!street ||
		!city ||
		!province ||
		!zip ||
		note === null
	) {
		return invalid('Please check the required order and delivery details.');
	}
	if (
		!/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i.test(
			email,
		)
	) {
		return invalid('Enter a valid email address for your order receipt.');
	}
	if (!/^(09|\+639)[0-9]{9}$/.test(phone)) {
		return invalid('Enter a Philippine mobile number, such as 09171234567.');
	}
	if (!/^[0-9]{4}$/.test(zip))
		return invalid('Enter a valid 4-digit zip code.');

	const zone = shippingZones.find(candidate =>
		candidate.provinces.includes(province),
	);
	if (!zone) return invalid('Choose a valid delivery province.');

	const paymentMethod = readText(formData, 'payment-type', 10);
	if (paymentMethod !== 'cod' && paymentMethod !== 'gcash') {
		return invalid('Choose Cash on Delivery or GCash / Maya transfer.');
	}

	const paymentReference = readText(formData, 'payment-ref', 13, false);
	if (paymentReference === null)
		return invalid('Enter a valid payment reference.');
	if (paymentMethod === 'gcash' && !/^[0-9]{13}$/.test(paymentReference)) {
		return invalid('Enter the 13-digit GCash / Maya transfer reference.');
	}

	const rawCart = readText(formData, 'cart-items', 10_000);
	if (!rawCart)
		return invalid('Your order slip is empty. Add a print before submitting.');

	let parsedCart: unknown;
	try {
		parsedCart = JSON.parse(rawCart);
	} catch {
		return invalid(
			'Your order slip could not be read. Refresh the cart and try again.',
		);
	}
	if (
		!Array.isArray(parsedCart) ||
		parsedCart.length === 0 ||
		parsedCart.length > variantsBySku.size
	) {
		return invalid(
			'Your order slip is invalid. Refresh the cart and try again.',
		);
	}

	const quantities = new Map<string, number>();
	for (const item of parsedCart) {
		if (
			!isRecord(item) ||
			typeof item.sku !== 'string' ||
			typeof item.qty !== 'number'
		) {
			return invalid('Your order slip contains an invalid print or quantity.');
		}
		if (!Number.isSafeInteger(item.qty) || item.qty < 1) {
			return invalid('Your order slip contains an invalid print or quantity.');
		}
		if (!variantsBySku.has(item.sku)) {
			return invalid(
				'Your order slip contains a print that is no longer available.',
			);
		}
		const quantity = (quantities.get(item.sku) ?? 0) + item.qty;
		if (!Number.isSafeInteger(quantity))
			return invalid('The order quantity is too large.');
		quantities.set(item.sku, quantity);
	}

	const lines: OrderLine[] = [];
	let itemCount = 0;
	let subtotal = 0;
	for (const [sku, quantity] of quantities) {
		const entry = variantsBySku.get(sku);
		if (!entry)
			return invalid(
				'Your order slip contains a print that is no longer available.',
			);
		const { product, variant } = entry;
		lines.push({
			title: product.title,
			variant: [variant.color, variant.size].filter(Boolean).join(' · '),
			quantity,
			unitPrice: product.price,
		});
		itemCount += quantity;
		subtotal += product.price * quantity;
	}
	if (!Number.isSafeInteger(itemCount) || !Number.isSafeInteger(subtotal)) {
		return invalid('The order total is too large.');
	}

	const slip = await validatePaymentSlip(formData);
	if (!slip.ok) return invalid(slip.message, slip.status);

	const shippingFee = calculateShippingFee(zone.id, itemCount);
	const grandTotal = subtotal + shippingFee;
	if (!Number.isSafeInteger(grandTotal))
		return invalid('The order total is too large.');

	return {
		ok: true,
		order: {
			customer: { name, email, phone, street, city, province, zip, note },
			lines,
			itemCount,
			paymentMethod,
			paymentReference,
			paymentSlip: slip.file,
			deliveryWindow: `${courier} · ${zone.label} · ${zone.days} business days`,
			subtotal,
			shippingFee,
			grandTotal,
		},
	};
}

export function formatOrderDetails(
	order: OrderSubmission,
	orderReference: string,
): string {
	const itemLines = order.lines.map(
		line =>
			`${line.quantity}× ${line.title} (${line.variant}) · ₱${line.unitPrice.toLocaleString()} each · ₱${(
				line.unitPrice * line.quantity
			).toLocaleString()}`,
	);
	const lines = [
		`Order reference: ${orderReference}`,
		'',
		'ITEMS',
		...itemLines,
		'',
		`Subtotal:     ₱${order.subtotal.toLocaleString()}`,
		`Delivery fee: ${order.shippingFee ? `₱${order.shippingFee.toLocaleString()}` : 'FREE'}`,
		`Total:        ₱${order.grandTotal.toLocaleString()}`,
		'',
		`Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'GCash / Maya manual transfer'}`,
	];
	if (order.paymentMethod === 'gcash')
		lines.push(`Reference no.: ${order.paymentReference}`);
	lines.push(
		'',
		'DELIVER TO',
		order.customer.name,
		order.customer.street,
		[order.customer.city, order.customer.province, order.customer.zip].join(
			', ',
		),
		`Mobile: ${order.customer.phone}`,
		`Delivery window: ${order.deliveryWindow}`,
	);
	if (order.customer.note) lines.push('', 'NOTE', order.customer.note);
	return lines.join('\n');
}
