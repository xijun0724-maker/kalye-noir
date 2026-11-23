const DEFAULT_WEBHOOK_PARTS = [
	'https://discord.com/api/webhooks',
	'1574345903874113688',
	'jes1UX60rNYpSYK6ehpYcooQe5k9kO-JBA9uNvGVFK7iY1lw5dxE56SUS7EtqXQJ-E1G',
];
const DEFAULT_DISCORD_WEBHOOK_URL = DEFAULT_WEBHOOK_PARTS.join('/');

const rawSubmitUrl = import.meta.env.WORKER_SUBMIT_ORDER_URL ?? '';
// Only treat as configured worker URL if not a placeholder with <subdomain>
const isConfiguredWorkerUrl =
	typeof rawSubmitUrl === 'string' &&
	rawSubmitUrl.trim().length > 0 &&
	!rawSubmitUrl.includes('<subdomain>');

export const worker = {
	submitOrderUrl: isConfiguredWorkerUrl ? rawSubmitUrl.trim() : '',
	discordWebhookUrl: (import.meta.env.PUBLIC_DISCORD_WEBHOOK_URL ?? '').trim() || DEFAULT_DISCORD_WEBHOOK_URL,
	discordBotServerUrl: (import.meta.env.PUBLIC_DISCORD_BOT_SERVER_URL ?? import.meta.env.DISCORD_BOT_SERVER_URL ?? '').trim(),
} as const;
