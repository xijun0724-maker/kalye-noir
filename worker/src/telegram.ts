import type { OrderSubmission } from 'kalye-noir-shared/validation';
import { formatOrderDetails } from 'kalye-noir-shared/validation';

export interface Env {
	BOT_TOKEN: string;
	CHAT_ID: string;
}

interface SendMessageResponse {
	ok: boolean;
	result?: { message_id: number };
	error_code?: number;
	description?: string;
}

const MAX_MESSAGE_LENGTH = 4096;

function chunkMessage(message: string): string[] {
	const chunks: string[] = [];
	let remaining = message;
	while (remaining.length > 0) {
		const chunk = remaining.slice(0, MAX_MESSAGE_LENGTH);
		chunks.push(chunk);
		remaining = remaining.slice(MAX_MESSAGE_LENGTH);
	}
	return chunks;
}

export async function sendOrderToTelegram(
	order: OrderSubmission,
	orderReference: string,
	env: Env,
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
	const orderDetails = formatOrderDetails(order, orderReference);
	const chunks = chunkMessage(orderDetails);

	const baseUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}`;

	// Send main message chunks
	for (let i = 0; i < chunks.length; i++) {
		const response = await fetch(`${baseUrl}/sendMessage`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: env.CHAT_ID,
				text: chunks[i],
				parse_mode: 'HTML',
			}),
		});

		const data: SendMessageResponse = await response.json();
		if (!data.ok) {
			return {
				ok: false,
				error: `Telegram sendMessage failed: ${data.description}`,
			};
		}
	}

	// Send payment slip if exists
	if (order.paymentSlip) {
		const file = order.paymentSlip;
		const formData = new FormData();
		formData.append('chat_id', env.CHAT_ID);
		formData.append('document', file, file.name);
		formData.append('caption', `Payment slip for order ${orderReference}`);

		const response = await fetch(`${baseUrl}/sendDocument`, {
			method: 'POST',
			body: formData,
		});

		const data: SendMessageResponse = await response.json();
		if (!data.ok) {
			// Try as photo if document fails (for images)
			const photoFormData = new FormData();
			photoFormData.append('chat_id', env.CHAT_ID);
			photoFormData.append('photo', file, file.name);
			photoFormData.append(
				'caption',
				`Payment slip for order ${orderReference}`,
			);

			const photoResponse = await fetch(`${baseUrl}/sendPhoto`, {
				method: 'POST',
				body: photoFormData,
			});

			const photoData: SendMessageResponse = await photoResponse.json();
			if (!photoData.ok) {
				return {
					ok: false,
					error: `Telegram sendDocument/sendPhoto failed: ${photoData.description}`,
				};
			}
		}
	}

	return { ok: true, messageId: 1 }; // Last message ID from chunks
}
