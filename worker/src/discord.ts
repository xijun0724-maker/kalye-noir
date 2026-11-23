import type { OrderSubmission } from 'kalye-noir-shared/validation';
import { sendDiscordNotification } from 'kalye-noir-shared/discord';

export interface DiscordEnv {
	DISCORD_WEBHOOK_URL?: string;
	DISCORD_BOT_TOKEN?: string;
	DISCORD_CHANNEL_ID?: string;
	DISCORD_BOT_SERVER_URL?: string;
	// Legacy fallback names
	BOT_TOKEN?: string;
	CHAT_ID?: string;
}

export async function sendOrderToDiscord(
	order: OrderSubmission,
	orderReference: string,
	env: DiscordEnv,
): Promise<{ ok: boolean; error?: string }> {
	const webhookUrl = env.DISCORD_WEBHOOK_URL;
	const botToken = env.DISCORD_BOT_TOKEN || env.BOT_TOKEN;
	const channelId = env.DISCORD_CHANNEL_ID || env.CHAT_ID;
	const botServerUrl = env.DISCORD_BOT_SERVER_URL;

	if (webhookUrl || (botToken && channelId) || botServerUrl) {
		return sendDiscordNotification(order, orderReference, {
			webhookUrl,
			botToken,
			channelId,
			botServerUrl,
		});
	}

	// In development or when credentials are not yet provided, log gracefully
	console.info(
		`[KALYE NOIR WORKER] Order ${orderReference} processed successfully (Awaiting Discord Bot API credentials).`,
	);
	return { ok: true };
}
