import type { Config } from '@netlify/functions';
import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { Resend } from 'resend';
import { contact, site } from '../../src/config/site.ts';
import {
	formatOrderDetails,
	ORDER_REQUEST_MAX_BYTES,
	parseOrderSubmission,
	type OrderSubmission,
} from '../../src/lib/orderSubmission.ts';

type SendOrderEmails = (
	order: OrderSubmission,
	orderReference: string,
) => Promise<void>;

function getErrorCode(error: unknown): string {
	if (
		error instanceof Error &&
		'code' in error &&
		typeof error.code === 'string'
	)
		return error.code;
	return error instanceof Error ? error.name : 'Unknown error';
}

const response = (
	status: number,
	body: Record<string, string>,
	headers: HeadersInit = {},
) =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
			...headers,
		},
	});

export function createSubmitOrderHandler(sendOrderEmails: SendOrderEmails) {
	return async (request: Request): Promise<Response> => {
		if (request.method !== 'POST') {
			return response(
				405,
				{ message: 'Send the order using the checkout form.' },
				{ allow: 'POST' },
			);
		}

		const origin = request.headers.get('origin');
		if (origin) {
			try {
				if (new URL(origin).origin !== new URL(request.url).origin) {
					return response(403, {
						message: 'The order request could not be verified.',
					});
				}
			} catch {
				return response(403, {
					message: 'The order request could not be verified.',
				});
			}
		}

		const contentLength = request.headers.get('content-length');
		if (
			contentLength &&
			/^\d+$/.test(contentLength) &&
			Number(contentLength) > ORDER_REQUEST_MAX_BYTES
		) {
			return response(413, {
				message:
					'The order request is too large. Receipt files must be 4 MB or smaller.',
			});
		}

		if (
			!request.headers
				.get('content-type')
				?.toLowerCase()
				.startsWith('multipart/form-data;')
		) {
			return response(415, {
				message: 'Submit the order using the checkout form.',
			});
		}

		let formData: FormData;
		try {
			formData = await request.formData();
		} catch (error) {
			console.error(
				'Order form could not be parsed.',
				error instanceof Error ? error.name : 'Unknown error',
			);
			return response(400, {
				message:
					'The order details could not be read. Please review them and try again.',
			});
		}

		const result = await parseOrderSubmission(formData);
		if (!result.ok) return response(result.status, { message: result.message });

		const orderReference = randomUUID().toUpperCase();
		try {
			await sendOrderEmails(result.order, orderReference);
		} catch (error) {
			console.error('Order email delivery failed.', getErrorCode(error));
			return response(502, {
				message:
					'We could not deliver your order email right now, so the order was not confirmed. Your details are still here; please try again.',
			});
		}

		return new Response(null, {
			status: 303,
			headers: {
				location: new URL('/order-thank-you', request.url).toString(),
				'cache-control': 'no-store',
			},
		});
	};
}

// Resend returns a discriminated union { data, error: null } | { error, data: null }.
// A send is successful only when both emails settle with data present and no error.
async function sendOrderEmails(
	order: OrderSubmission,
	orderReference: string,
): Promise<void> {
	const apiKey = Netlify.env.get('RESEND_API_KEY');
	if (!apiKey) {
		console.error(
			'Order emails could not be sent because RESEND_API_KEY is not configured.',
		);
		throw new Error('RESEND_API_KEY is not configured.');
	}

	const resend = new Resend(apiKey);

	const details = formatOrderDetails(order, orderReference);
	const firstName = order.customer.name.split(/\s+/)[0] || 'there';

	const receiptAttachment = order.paymentSlip
		? [
				{
					filename:
						order.paymentSlip.type === 'application/pdf'
							? 'payment-receipt.pdf'
							: order.paymentSlip.type === 'image/jpeg'
								? 'payment-receipt.jpg'
								: order.paymentSlip.type === 'image/png'
									? 'payment-receipt.png'
									: 'payment-receipt.webp',
					content: Buffer.from(await order.paymentSlip.arrayBuffer()),
					contentType: order.paymentSlip.type,
				},
			]
		: undefined;

	// Resend sends from a verified domain. The default sandbox domain works for
	// development; for production, verify a domain you own in the Resend dashboard
	// (resend.com/domains) and set RESEND_FROM to an address at that domain.
	// kalyenoir.netlify.app is a Netlify shared domain and cannot be verified in
	// Resend, so use a domain you control instead.
	const from =
		Netlify.env.get('RESEND_FROM') ?? `KALYE NOIR <onboarding@resend.dev>`;

	const customerPaymentNote =
		order.paymentMethod === 'gcash'
			? 'The studio will verify your GCash / Maya transfer reference before dispatch. This email is not a payment confirmation.'
			: 'Cash on Delivery is payable to the courier when your order is delivered.';

	const storeEmail: Parameters<typeof resend.emails.send>[0] = {
		from,
		to: contact.email,
		replyTo: order.customer.email,
		subject: `New order ${orderReference} · ${order.customer.name.replace(/[\r\n]/g, ' ')}`,
		text: `${details}\n\nCustomer email: ${order.customer.email}`,
		...(receiptAttachment ? { attachments: receiptAttachment } : {}),
	};

	const customerEmail: Parameters<typeof resend.emails.send>[0] = {
		from,
		to: order.customer.email,
		replyTo: contact.email,
		subject: `${site.name}: order request received · ${orderReference}`,
		text: [
			`Hi ${firstName},`,
			'',
			'We received your order request. Here is your order summary:',
			'',
			details,
			'',
			customerPaymentNote,
			'',
			'This confirms receipt of your request, not stock availability, payment, or dispatch.',
			'',
			`Questions? Reply to this email or text ${contact.mobile}.`,
			'',
			site.name,
		].join('\n'),
	};

	type SendResult =
		| { ok: true; id: string }
		| { ok: false; error: unknown };

	const sendOne = (
		params: Parameters<typeof resend.emails.send>[0],
	): Promise<SendResult> =>
		(resend.emails.send(params) as unknown) as Promise<SendResult>;

	try {
		const [storeResult, customerResult] = await Promise.all([
			sendOne(storeEmail),
			sendOne(customerEmail),
		]);

		const failures = [storeResult, customerResult].filter(
			(r): r is Extract<typeof r, { ok: false }> => !r.ok,
		);

		if (failures.length) {
			console.error(
				'Resend did not accept both order emails.',
				failures.map((f) =>
					f.error instanceof Error ? getErrorCode(f.error) : f.error,
				),
			);
			throw new Error('Resend did not accept both order emails.');
		}
	} catch (error) {
		if (
			error instanceof Error &&
			error.message === 'Resend did not accept both order emails.'
		) {
			throw error;
		}
		console.error('Resend could not send the order emails.', getErrorCode(error));
		throw new Error('Resend could not send the order emails.');
	}
}

export const config: Config = {
	method: 'POST',
	rateLimit: {
		action: 'rate_limit',
		aggregateBy: 'ip',
		windowLimit: 10,
		windowSize: 60,
	},
};

export default {
	fetch: createSubmitOrderHandler(sendOrderEmails),
};
