import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { buildDiscordOrderPayload } from '../shared/discord.ts';
import type { OrderSubmission } from '../shared/validation.ts';

const mockOrder: OrderSubmission = {
	customer: {
		name: 'Juan Dela Cruz',
		email: 'juan@example.com',
		phone: '09171234567',
		street: '123 Kalye St.',
		city: 'Manila',
		province: 'Metro Manila',
		zip: '1000',
		note: 'Leave with guard',
	},
	lines: [
		{
			title: 'KALYENOIR TEE',
			variant: 'Black · L',
			quantity: 1,
			unitPrice: 253,
		},
		{
			title: 'MEDUSA TEE',
			variant: 'Black · XL',
			quantity: 2,
			unitPrice: 265,
		},
	],
	itemCount: 3,
	paymentMethod: 'cod',
	paymentReference: '',
	deliveryWindow: 'LBC Express · Metro Manila · 1–3 business days',
	subtotal: 783,
	shippingFee: 0,
	grandTotal: 783,
};

test('discord: buildDiscordOrderPayload formats rich embed with all order details', () => {
	const ref = 'KN-TEST-9999';
	const payload = buildDiscordOrderPayload(mockOrder, ref);

	assert.ok(payload.content.includes(ref), 'message content mentions order reference');
	assert.equal(payload.embeds.length, 1, 'has 1 embed');

	const embed = payload.embeds[0];
	assert.equal(embed.color, 13115434, 'embed uses registration-red color #c8202a');
	assert.ok(embed.title.includes(ref), 'embed title mentions reference');

	const customerField = embed.fields.find(f => f.name.includes('Customer'));
	assert.ok(customerField?.value.includes('Juan Dela Cruz'));
	assert.ok(customerField?.value.includes('09171234567'));

	const itemsField = embed.fields.find(f => f.name.includes('Order Items'));
	assert.ok(itemsField?.value.includes('KALYENOIR TEE'));
	assert.ok(itemsField?.value.includes('MEDUSA TEE'));

	const paymentField = embed.fields.find(f => f.name.includes('Payment & Totals'));
	assert.ok(paymentField?.value.includes('Cash on Delivery (COD)'));
	assert.ok(paymentField?.value.includes('783'));

	const noteField = embed.fields.find(f => f.name.includes('Order Note'));
	assert.ok(noteField?.value.includes('Leave with guard'));
});

test('discord: sendDiscordNotification returns error gracefully when unconfigured', async () => {
	const { sendDiscordNotification } = await import('../shared/discord.ts');
	const res = await sendDiscordNotification(mockOrder, 'KN-TEST-0000', {});
	assert.equal(res.ok, false);
	assert.ok(res.error?.includes('No Discord'));
});
