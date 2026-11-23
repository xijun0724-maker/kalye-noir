import {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} from 'discord.js';

// Kalye Noir signature Registration-Red
export const BRAND_COLOR = 0xc8202a;

export const STATUS_COLORS = {
	PENDING: 0xf59e0b, // Amber
	PACKED: 0x3b82f6, // Blue
	SHIPPED: 0x8b5cf6, // Purple
	DELIVERED: 0x10b981, // Green
	CANCELLED: 0xef4444, // Red
};

export const STATUS_EMOJIS = {
	PENDING: '🟡 PENDING',
	PACKED: '📦 PACKED',
	SHIPPED: '🚚 SHIPPED',
	DELIVERED: '✅ DELIVERED',
	CANCELLED: '❌ CANCELLED',
};

/**
 * Creates the primary Order Embed displayed in the Discord alerts channel
 */
export function buildOrderEmbed(order) {
	const statusBadge = STATUS_EMOJIS[order.status] || order.status;
	const color = STATUS_COLORS[order.status] || BRAND_COLOR;

	const itemLines = (order.lines || []).map(line => {
		const qty = line.quantity || 1;
		const price = line.unitPrice || 0;
		const lineTotal = price * qty;
		return `• **${qty}× ${line.title}** (${line.variant || 'Standard'})\n  ₱${price.toLocaleString()} each → **₱${lineTotal.toLocaleString()}**`;
	});

	const paymentText =
		order.paymentMethod === 'cod'
			? '💵 **Cash on Delivery (COD)**'
			: `📱 **GCash / Maya Manual Transfer**\n*Ref:* \`${order.paymentReference || 'N/A'}\``;

	const customerText = [
		`**Name:** ${order.customer.name}`,
		`**Email:** ${order.customer.email}`,
		`**Phone:** \`${order.customer.phone}\``,
	].join('\n');

	const addressLines = [
		order.customer.street,
		order.customer.barangay ? `Brgy. ${order.customer.barangay}` : null,
		order.customer.landmark ? `*Landmark:* ${order.customer.landmark}` : null,
		`${order.customer.city}, ${order.customer.province} ${order.customer.zip}`,
		`*Delivery Window:* ${order.deliveryWindow || 'Standard delivery'}`,
	].filter(Boolean);

	const embed = new EmbedBuilder()
		.setTitle(`🚨 ORDER #${order.reference}`)
		.setColor(color)
		.addFields(
			{
				name: '📊 Fulfillment Status',
				value: `**${statusBadge}**${order.updatedBy ? ` (updated by ${order.updatedBy})` : ''}`,
				inline: true,
			},
			{
				name: '💰 Order Total',
				value: `**₱${(order.grandTotal || 0).toLocaleString()}** (${order.lines?.length || 0} items)`,
				inline: true,
			},
			{
				name: '👤 Customer Information',
				value: customerText,
				inline: false,
			},
			{
				name: '📍 Delivery Address',
				value: addressLines.join('\n'),
				inline: false,
			},
			{
				name: `👕 Order Items (${(order.lines || []).reduce((acc, l) => acc + (l.quantity || 1), 0)} pcs total)`,
				value: itemLines.join('\n') || 'No items',
				inline: false,
			},
			{
				name: '💳 Payment Breakdown',
				value: [
					paymentText,
					`Subtotal: ₱${(order.subtotal || 0).toLocaleString()}`,
					`Delivery Fee: ${order.shippingFee ? `₱${order.shippingFee.toLocaleString()}` : 'FREE'}`,
					`Grand Total: **₱${(order.grandTotal || 0).toLocaleString()}**`,
				].join('\n'),
				inline: false,
			},
		)
		.setFooter({
			text: 'Kalye Noir Manila · Streetside Apparel Studio',
		})
		.setTimestamp(new Date(order.createdAt || Date.now()));

	if (order.customer.note) {
		embed.addFields({
			name: '📝 Customer Order Note',
			value: `*"${order.customer.note}"*`,
			inline: false,
		});
	}

	return embed;
}

/**
 * Creates interactive Action Row Buttons for quick order status transitions
 */
export function buildOrderActionRow(order) {
	const ref = order.reference;
	const current = order.status;

	const packButton = new ButtonBuilder()
		.setCustomId(`order_pack_${ref}`)
		.setLabel('Pack')
		.setEmoji('📦')
		.setStyle(ButtonStyle.Primary)
		.setDisabled(current === 'PACKED' || current === 'SHIPPED' || current === 'DELIVERED' || current === 'CANCELLED');

	const shipButton = new ButtonBuilder()
		.setCustomId(`order_ship_${ref}`)
		.setLabel('Ship')
		.setEmoji('🚚')
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(current === 'SHIPPED' || current === 'DELIVERED' || current === 'CANCELLED');

	const deliverButton = new ButtonBuilder()
		.setCustomId(`order_deliver_${ref}`)
		.setLabel('Delivered')
		.setEmoji('✅')
		.setStyle(ButtonStyle.Success)
		.setDisabled(current === 'DELIVERED' || current === 'CANCELLED');

	const cancelButton = new ButtonBuilder()
		.setCustomId(`order_cancel_${ref}`)
		.setLabel('Cancel')
		.setEmoji('❌')
		.setStyle(ButtonStyle.Danger)
		.setDisabled(current === 'DELIVERED' || current === 'CANCELLED');

	return new ActionRowBuilder().addComponents(packButton, shipButton, deliverButton, cancelButton);
}

/**
 * Embed for store stats
 */
export function buildStatsEmbed(stats) {
	return new EmbedBuilder()
		.setTitle('📊 Kalye Noir Store Statistics')
		.setColor(BRAND_COLOR)
		.addFields(
			{
				name: '💵 Total Revenue',
				value: `**₱${stats.totalRevenue.toLocaleString()}**`,
				inline: true,
			},
			{
				name: '📦 Total Orders',
				value: `**${stats.totalOrders}** orders`,
				inline: true,
			},
			{
				name: '👕 Total Shirts Sold',
				value: `**${stats.totalItemsSold}** pcs`,
				inline: true,
			},
			{
				name: '💳 Payment Breakdown',
				value: `• COD: **${stats.codOrders}**\n• GCash / Maya: **${stats.gcashOrders}**`,
				inline: true,
			},
			{
				name: '📋 Status Breakdown',
				value: [
					`🟡 Pending: **${stats.countsByStatus.PENDING}**`,
					`📦 Packed: **${stats.countsByStatus.PACKED}**`,
					`🚚 Shipped: **${stats.countsByStatus.SHIPPED}**`,
					`✅ Delivered: **${stats.countsByStatus.DELIVERED}**`,
					`❌ Cancelled: **${stats.countsByStatus.CANCELLED}**`,
				].join('\n'),
				inline: true,
			},
		)
		.setFooter({ text: 'Kalye Noir Live Store Tracker' })
		.setTimestamp();
}
