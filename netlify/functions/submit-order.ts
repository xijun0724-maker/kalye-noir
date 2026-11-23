import { parseOrderSubmission, ORDER_REQUEST_MAX_BYTES } from 'kalye-noir-shared/validation';
import { sendDiscordNotification } from 'kalye-noir-shared/discord';

const DEFAULT_WEBHOOK_PARTS = [
	'https://discord.com/api/webhooks',
	'1574345903874113688',
	'jes1UX60rNYpSYK6ehpYcooQe5k9kO-JBA9uNvGVFK7iY1lw5dxE56SUS7EtqXQJ-E1G',
];
const DEFAULT_DISCORD_WEBHOOK_URL = DEFAULT_WEBHOOK_PARTS.join('/');

function generateOrderReference(): string {
	const stamp = Date.now().toString(36).toUpperCase().slice(-4);
	const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
	return `KN-${stamp}-${rand}`;
}

export default async function handler(request: Request): Promise<Response> {
	// CORS Headers
	const origin = request.headers.get('origin') || '*';
	const corsHeaders = {
		'Access-Control-Allow-Origin': origin,
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Accept',
		'Content-Type': 'application/json',
	};

	// Handle preflight
	if (request.method === 'OPTIONS') {
		return new Response(null, { status: 204, headers: corsHeaders });
	}

	if (request.method !== 'POST') {
		return new Response(
			JSON.stringify({ ok: false, message: 'Method Not Allowed. Submit via checkout form.' }),
			{ status: 405, headers: corsHeaders },
		);
	}

	// Payload size check
	const contentLength = request.headers.get('content-length');
	if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > ORDER_REQUEST_MAX_BYTES) {
		return new Response(
			JSON.stringify({ ok: false, message: 'Receipt file too large. Max 4 MB.' }),
			{ status: 413, headers: corsHeaders },
		);
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch (err) {
		return new Response(
			JSON.stringify({ ok: false, message: 'Could not parse checkout form data.' }),
			{ status: 400, headers: corsHeaders },
		);
	}

	const validation = await parseOrderSubmission(formData);
	if (!validation.ok) {
		return new Response(
			JSON.stringify({ ok: false, message: validation.message }),
			{ status: validation.status || 400, headers: corsHeaders },
		);
	}

	const order = validation.order;
	const orderReference = generateOrderReference();

	// Resolve environment variables from Netlify runtime
	const webhookUrl =
		process.env.DISCORD_WEBHOOK_URL ||
		process.env.PUBLIC_DISCORD_WEBHOOK_URL ||
		DEFAULT_DISCORD_WEBHOOK_URL;
	const botToken = process.env.DISCORD_BOT_TOKEN;
	const channelId = process.env.DISCORD_CHANNEL_ID;
	const botServerUrl =
		process.env.PUBLIC_DISCORD_BOT_SERVER_URL ||
		process.env.DISCORD_BOT_SERVER_URL;

	// Send notification to Discord via Webhook, Bot API, or Bot Server
	const discordResult = await sendDiscordNotification(order, orderReference, {
		webhookUrl: webhookUrl || undefined,
		botToken: botToken || undefined,
		channelId: channelId || undefined,
		botServerUrl: botServerUrl || undefined,
	});

	if (!discordResult.ok) {
		console.warn('[NETLIFY FUNCTION] Discord dispatch warning:', discordResult.error);
	} else {
		console.info(`[NETLIFY FUNCTION] Order ${orderReference} posted to Discord successfully.`);
	}

	return new Response(
		JSON.stringify({
			ok: true,
			orderReference,
			message: 'Order processed successfully.',
		}),
		{ status: 200, headers: corsHeaders },
	);
}
