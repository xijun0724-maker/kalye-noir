import type { OrderSubmission } from './validation.ts';

export interface DiscordConfig {
	webhookUrl?: string;
	botToken?: string;
	channelId?: string;
	botServerUrl?: string;
}

export interface DiscordEmbedField {
	name: string;
	value: string;
	inline?: boolean;
}

export interface DiscordEmbed {
	title: string;
	description?: string;
	color: number;
	fields: DiscordEmbedField[];
	footer?: { text: string };
	timestamp?: string;
}

export interface DiscordPayload {
	content: string;
	embeds: DiscordEmbed[];
}

/**
 * Builds a structured Discord embed payload for an order.
 * Uses registration-red (#C8202A = 13115434) for Kalye Noir branding.
 */
export function buildDiscordOrderPayload(
	order: OrderSubmission,
	orderReference: string,
): DiscordPayload {
	const itemLines = order.lines.map(
		line =>
			`• **${line.quantity}× ${line.title}** (${line.variant})\n  ₱${line.unitPrice.toLocaleString()} each → **₱${(line.unitPrice * line.quantity).toLocaleString()}**`,
	);

	const fields: DiscordEmbedField[] = [
		{
			name: '👤 Customer Information',
			value: `**Name:** ${order.customer.name}\n**Email:** ${order.customer.email}\n**Phone:** \`${order.customer.phone}\``,
			inline: false,
		},
		{
			name: '📍 Delivery Address',
			value: `${order.customer.street}\n${order.customer.city}, ${order.customer.province} ${order.customer.zip}\n*Window:* ${order.deliveryWindow}`,
			inline: false,
		},
		{
			name: `👕 Order Items (${order.itemCount} ${order.itemCount === 1 ? 'pc' : 'pcs'})`,
			value: itemLines.join('\n') || 'No items',
			inline: false,
		},
		{
			name: '💳 Payment & Totals',
			value: `**Subtotal:** ₱${order.subtotal.toLocaleString()}\n**Delivery Fee:** ${order.shippingFee ? `₱${order.shippingFee.toLocaleString()}` : 'FREE'}\n**Grand Total:** ₱${order.grandTotal.toLocaleString()}\n**Method:** ${order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : `GCash / Maya Manual (Ref: \`${order.paymentReference}\`)`}`,
			inline: false,
		},
	];

	if (order.customer.note) {
		fields.push({
			name: '📝 Order Note',
			value: order.customer.note,
			inline: false,
		});
	}

	return {
		content: `🚨 **NEW ORDER RECEIVED — KALYE NOIR STREETWEAR** \`#${orderReference}\``,
		embeds: [
			{
				title: `Order Summary · ${orderReference}`,
				color: 13115434, // #c8202a
				fields,
				footer: {
					text: 'Kalye Noir Manila · Streetside Apparel Studio',
				},
				timestamp: new Date().toISOString(),
			},
		],
	};
}

/**
 * Sends order notification to Discord via Webhook or Bot API.
 */
export async function sendDiscordNotification(
	order: OrderSubmission,
	orderReference: string,
	config: DiscordConfig,
): Promise<{ ok: boolean; error?: string }> {
	const payload = buildDiscordOrderPayload(order, orderReference);

	// Case 1: Bot Server HTTP API provided (with interactive button support)
	if (config.botServerUrl) {
		try {
			const res = await fetch(config.botServerUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reference: orderReference,
					createdAt: new Date().toISOString(),
					customer: order.customer,
					lines: order.lines,
					subtotal: order.subtotal,
					shippingFee: order.shippingFee,
					grandTotal: order.grandTotal,
					paymentMethod: order.paymentMethod,
					paymentReference: order.paymentReference,
					deliveryWindow: order.deliveryWindow,
				}),
			});
			if (!res.ok) {
				const text = await res.text();
				return { ok: false, error: `Bot Server HTTP ${res.status}: ${text}` };
			}
			return { ok: true };
		} catch (err) {
			return {
				ok: false,
				error: err instanceof Error ? err.message : 'Bot Server connection error',
			};
		}
	}

	// Case 2: Discord Webhook URL provided
	if (config.webhookUrl) {
		try {
			if (order.paymentSlip) {
				const formData = new FormData();
				formData.append('payload_json', JSON.stringify(payload));
				formData.append('files[0]', order.paymentSlip, order.paymentSlip.name);

				const res = await fetch(config.webhookUrl, {
					method: 'POST',
					body: formData,
				});
				if (!res.ok) {
					const text = await res.text();
					return { ok: false, error: `Discord Webhook HTTP ${res.status}: ${text}` };
				}
				return { ok: true };
			} else {
				const res = await fetch(config.webhookUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				});
				if (!res.ok) {
					const text = await res.text();
					return { ok: false, error: `Discord Webhook HTTP ${res.status}: ${text}` };
				}
				return { ok: true };
			}
		} catch (err) {
			return {
				ok: false,
				error: err instanceof Error ? err.message : 'Discord Webhook connection error',
			};
		}
	}

	// Case 2: Discord Bot Token + Channel ID provided
	if (config.botToken && config.channelId) {
		try {
			const endpoint = `https://discord.com/api/v10/channels/${config.channelId}/messages`;
			const authHeader = config.botToken.startsWith('Bot ')
				? config.botToken
				: `Bot ${config.botToken}`;

			if (order.paymentSlip) {
				const formData = new FormData();
				formData.append('payload_json', JSON.stringify(payload));
				formData.append('files[0]', order.paymentSlip, order.paymentSlip.name);

				const res = await fetch(endpoint, {
					method: 'POST',
					headers: { Authorization: authHeader },
					body: formData,
				});
				if (!res.ok) {
					const text = await res.text();
					return { ok: false, error: `Discord Bot API HTTP ${res.status}: ${text}` };
				}
				return { ok: true };
			} else {
				const res = await fetch(endpoint, {
					method: 'POST',
					headers: {
						Authorization: authHeader,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(payload),
				});
				if (!res.ok) {
					const text = await res.text();
					return { ok: false, error: `Discord Bot API HTTP ${res.status}: ${text}` };
				}
				return { ok: true };
			}
		} catch (err) {
			return {
				ok: false,
				error: err instanceof Error ? err.message : 'Discord Bot connection error',
			};
		}
	}

	// No Discord configuration provided yet
	return {
		ok: false,
		error: 'No Discord Webhook URL or Bot Token configured.',
	};
}
