export const worker = {
	submitOrderUrl:
		import.meta.env.WORKER_SUBMIT_ORDER_URL ??
		'https://kalye-noir-orders.<subdomain>.workers.dev/api/submit-order',
} as const;
