const rawSubmitUrl = import.meta.env.WORKER_SUBMIT_ORDER_URL ?? '';
// Only treat as configured worker URL if not a placeholder with <subdomain>
const isConfiguredWorkerUrl =
	typeof rawSubmitUrl === 'string' &&
	rawSubmitUrl.trim().length > 0 &&
	!rawSubmitUrl.includes('<subdomain>');

export const worker = {
	submitOrderUrl: isConfiguredWorkerUrl ? rawSubmitUrl.trim() : '/api/submit-order',
	discordWebhookUrl: (import.meta.env.PUBLIC_DISCORD_WEBHOOK_URL ?? '').trim(),
	discordBotServerUrl: (import.meta.env.PUBLIC_DISCORD_BOT_SERVER_URL ?? import.meta.env.DISCORD_BOT_SERVER_URL ?? '').trim(),
} as const;
