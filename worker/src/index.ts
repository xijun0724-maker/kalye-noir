import { parseOrderSubmission, ORDER_REQUEST_MAX_BYTES } from 'kalye-noir-shared/validation';
import { sendOrderToDiscord } from './discord';
import type { OrderSubmission } from 'kalye-noir-shared/validation';

function generateOrderReference(): string {
	// Use Web Crypto API available in Cloudflare Workers
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, b => b.toString(16).padStart(2, '0'))
		.join('')
		.toUpperCase();
}

type SendOrderResult =
	| { ok: true; order: OrderSubmission; orderReference: string }
	| { ok: false; status: 400 | 403 | 405 | 413 | 415 | 502; message: string };

function getErrorCode(error: unknown): string {
	if (
		error instanceof Error &&
		'code' in error &&
		typeof error.code === 'string'
	)
		return error.code;
	return error instanceof Error ? error.name : 'Unknown error';
}

function response(
	status: number,
	body: Record<string, string>,
	headers: HeadersInit = {},
): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
			...headers,
		},
	});
}

async function handleSubmitOrder(
	request: Request,
	env: Env,
): Promise<SendOrderResult> {
	if (request.method !== 'POST') {
		return {
			ok: false,
			status: 405,
			message: 'Send the order using the checkout form.',
		};
	}

	const origin = request.headers.get('origin');
	if (origin) {
		try {
			if (new URL(origin).origin !== new URL(request.url).origin) {
				return {
					ok: false,
					status: 403,
					message: 'The order request could not be verified.',
				};
			}
		} catch {
			return {
				ok: false,
				status: 403,
				message: 'The order request could not be verified.',
			};
		}
	}

	const contentLength = request.headers.get('content-length');
	if (
		contentLength &&
		/^\d+$/.test(contentLength) &&
		Number(contentLength) > ORDER_REQUEST_MAX_BYTES
	) {
		return {
			ok: false,
			status: 413,
			message:
				'The order request is too large. Receipt files must be 4 MB or smaller.',
		};
	}

	if (
		!request.headers
			.get('content-type')
			?.toLowerCase()
			.startsWith('multipart/form-data;')
	) {
		return {
			ok: false,
			status: 415,
			message: 'Submit the order using the checkout form.',
		};
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch (error) {
		console.error(
			'Order form could not be parsed.',
			error instanceof Error ? error.name : 'Unknown error',
		);
		return {
			ok: false,
			status: 400,
			message:
				'The order details could not be read. Please review them and try again.',
		};
	}

	const result = await parseOrderSubmission(formData);
	if (!result.ok)
		return { ok: false, status: result.status, message: result.message };

	const orderReference = generateOrderReference();

	const discordResult = await sendOrderToDiscord(
		result.order,
		orderReference,
		env,
	);
	if (!discordResult.ok) {
		console.warn('Discord order notification notice:', discordResult.error);
	}

	return { ok: true, order: result.order, orderReference };
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const requestUrl = new URL(request.url);
		const origin = request.headers.get('origin');

		// CORS: only allow requests from the same origin (production site).
		// The CSRF check below already validates the origin; echo it back if verified.
		// Do not fall back to '*' to avoid credentialed requests from unexpected origins.
		const allowOrigin = origin && new URL(origin).origin === requestUrl.origin ? origin : null;

		// CORS headers - restrict to verified origin only
		const corsHeaders = {
			'Access-Control-Allow-Origin': allowOrigin ?? '',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			...(allowOrigin ? { 'Vary': 'Origin' } : {}),
		};

		// Handle preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}

		if (requestUrl.pathname !== '/api/submit-order') {
			return new Response('Not Found', { status: 404 });
		}

		const result = await handleSubmitOrder(request, env);

		if (!result.ok) {
			return response(result.status, { message: result.message }, corsHeaders);
		}

		// Success: redirect to cart with success params
		const redirectUrl = new URL('/cart', requestUrl);
		redirectUrl.searchParams.set('success', '1');
		redirectUrl.searchParams.set('ref', result.orderReference);

		return new Response(null, {
			status: 303,
			headers: {
				location: redirectUrl.toString(),
				'cache-control': 'no-store',
				...corsHeaders,
			},
		});
	},
} satisfies ExportedHandler<Env>;

interface Env {
	DISCORD_WEBHOOK_URL?: string;
	DISCORD_BOT_TOKEN?: string;
	DISCORD_CHANNEL_ID?: string;
	BOT_TOKEN?: string;
	CHAT_ID?: string;
}
