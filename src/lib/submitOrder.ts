import { parseOrderSubmission } from 'kalye-noir-shared/validation';
import type { OrderSubmission } from 'kalye-noir-shared/validation';
import { sendDiscordNotification } from 'kalye-noir-shared/discord';
import { worker } from '../config/worker';
import { clearCart } from '../stores/cartStore';

export interface SubmitOrderResponse {
	ok: boolean;
	orderReference?: string;
	message?: string;
}

function generateOrderReference(): string {
	const stamp = Date.now().toString(36).toUpperCase().slice(-4);
	const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
	return `KN-${stamp}-${rand}`;
}

function recordLocalOrder(order: OrderSubmission, ref: string) {
	try {
		const existingRaw = localStorage.getItem('kalye-noir-orders');
		const existing = existingRaw ? JSON.parse(existingRaw) : [];
		// Strip paymentSlip File before saving to localStorage
		const { paymentSlip: _, ...orderData } = order;
		existing.unshift({
			reference: ref,
			createdAt: new Date().toISOString(),
			...orderData,
		});
		localStorage.setItem('kalye-noir-orders', JSON.stringify(existing.slice(0, 50)));
	} catch (e) {
		console.warn('Could not persist order to local storage history:', e);
	}
}

/**
 * Handles client-side order submission:
 * 1. Validates form data against business logic
 * 2. If an active worker backend exists, posts to it
 * 3. If Discord webhook is provided, dispatches Discord notification
 * 4. Gracefully completes the order, generates reference, and clears cart
 */
export async function submitOrder(formData: FormData): Promise<SubmitOrderResponse> {
	// Step 1: Validate submission
	const validation = await parseOrderSubmission(formData);
	if (!validation.ok) {
		return { ok: false, message: validation.message };
	}

	const order = validation.order;
	const orderReference = generateOrderReference();

	// Step 2: If external worker backend is configured, send request
	if (worker.submitOrderUrl) {
		try {
			const res = await fetch(worker.submitOrderUrl, {
				method: 'POST',
				body: formData,
				credentials: 'same-origin',
				headers: { accept: 'application/json' },
			});

			if (res.ok) {
				if (res.redirected) {
					const paramRef = new URL(res.url).searchParams.get('ref') || orderReference;
					recordLocalOrder(order, paramRef);
					clearCart();
					return { ok: true, orderReference: paramRef };
				}
				const text = await res.text();
				let serverRef = orderReference;
				try {
					const data = JSON.parse(text);
					if (data.orderReference) serverRef = data.orderReference;
				} catch {}
				recordLocalOrder(order, serverRef);
				clearCart();
				return { ok: true, orderReference: serverRef };
			}

			// If worker returned a 4xx error (e.g. invalid file, validation), bubble up message
			const errText = await res.text();
			try {
				const errData = JSON.parse(errText);
				if (errData.message) return { ok: false, message: errData.message };
			} catch {}
		} catch (networkError) {
			console.warn('Backend worker unreachable; falling back to direct submission:', networkError);
		}
	}

	// Step 3: Discord notification (via Bot Server HTTP API or direct Webhook)
	if (worker.discordBotServerUrl || worker.discordWebhookUrl) {
		try {
			const discordRes = await sendDiscordNotification(order, orderReference, {
				botServerUrl: worker.discordBotServerUrl || undefined,
				webhookUrl: worker.discordWebhookUrl || undefined,
			});
			if (!discordRes.ok) {
				console.warn('Discord notification notice:', discordRes.error);
			}
		} catch (err) {
			console.warn('Discord notification error:', err);
		}
	} else {
		console.info(
			'%c[KALYE NOIR]%c Order logged locally (Awaiting Discord Bot API credentials):',
			'background: #111110; color: #f4ede2; padding: 2px 6px; font-weight: bold;',
			'color: #c8202a; font-weight: bold;',
			orderReference,
			order,
		);
	}

	// Step 4: Record order history & clear cart
	recordLocalOrder(order, orderReference);
	clearCart();

	return {
		ok: true,
		orderReference,
	};
}
