import {
	Client,
	GatewayIntentBits,
	ActivityType,
	EmbedBuilder,
} from 'discord.js';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

import {
	saveOrder,
	getOrderByRef,
	updateOrderStatus,
	getRecentOrders,
	getOrderStats,
	setOrderDiscordMessageId,
} from './orders.mjs';
import {
	BRAND_COLOR,
	STATUS_EMOJIS,
	buildOrderEmbed,
	buildOrderActionRow,
	buildStatsEmbed,
} from './embeds.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const PORT = process.env.PORT || 4323;
const API_SECRET = process.env.ORDER_API_SECRET;

if (!TOKEN) {
	console.error('❌ DISCORD_BOT_TOKEN is not set in discord-bot/.env');
	console.error('Please configure .env before starting the bot.');
	process.exit(1);
}

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Catalog data
const CATALOG = [
	{
		title: "MANILA '93 STREET GRAPHIC TEE",
		price: 750,
		sizes: 'XS, S, M, L, XL',
		desc: 'Heavyweight 240 GSM combed cotton with high-density Manila vintage print.',
	},
	{
		title: 'DIVISORIA NIGHT MARKET OVERSIZED TEE',
		price: 750,
		sizes: 'XS, S, M, L, XL',
		desc: 'Boxy drop-shoulder cut, washed vintage black, distressed screenprint.',
	},
	{
		title: 'QUIAPO CHRONICLES TEE',
		price: 750,
		sizes: 'XS, S, M, L, XL',
		desc: 'Monochrome high-contrast street photo print on premium organic cotton.',
	},
	{
		title: 'TONDO DISTRICT HEAVYWEIGHT TEE',
		price: 750,
		sizes: 'XS, S, M, L, XL',
		desc: 'Double-needle stitched collar with signature registration-red label.',
	},
	{
		title: 'INTRAMUROS WALLS RAW CUT TEE',
		price: 750,
		sizes: 'XS, S, M, L, XL',
		desc: 'Raw edge sleeve hems, distressed charcoal wash, archival city typography.',
	},
];

client.once('ready', () => {
	console.log(`🤖 Kalye Noir Discord Bot online as: ${client.user.tag}`);
	client.user.setPresence({
		activities: [
			{
				name: 'Kalye Noir Orders',
				type: ActivityType.Watching,
			},
		],
		status: 'online',
	});

	startHttpServer();
});

// Interaction handling (Slash commands & Buttons)
client.on('interactionCreate', async interaction => {
	try {
		if (interaction.isChatInputCommand()) {
			await handleSlashCommand(interaction);
		} else if (interaction.isButton()) {
			await handleButton(interaction);
		}
	} catch (err) {
		console.error('[Bot Error] Interaction failed:', err);
		const errorMsg = '⚠️ An error occurred while executing this action.';
		if (interaction.deferred || interaction.replied) {
			await interaction.followUp({ content: errorMsg, ephemeral: true }).catch(() => {});
		} else {
			await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => {});
		}
	}
});

async function handleSlashCommand(interaction) {
	const { commandName } = interaction;

	if (commandName === 'ping') {
		const latency = Date.now() - interaction.createdTimestamp;
		await interaction.reply({
			content: `🏓 **Pong!** Latency: \`${latency}ms\` | WebSocket: \`${client.ws.ping}ms\``,
			ephemeral: true,
		});
		return;
	}

	if (commandName === 'stats') {
		const stats = getOrderStats();
		const embed = buildStatsEmbed(stats);
		await interaction.reply({ embeds: [embed] });
		return;
	}

	if (commandName === 'catalog') {
		const embed = new EmbedBuilder()
			.setTitle('👕 Kalye Noir Streetwear Catalog')
			.setColor(BRAND_COLOR)
			.setDescription('Active collection available online at `http://localhost:4322/products`')
			.setFooter({ text: 'Kalye Noir Apparel Studio · Manila' });

		for (const item of CATALOG) {
			embed.addFields({
				name: `${item.title} — ₱${item.price.toLocaleString()}`,
				value: `${item.desc}\n*Available Sizes:* \`${item.sizes}\``,
				inline: false,
			});
		}

		await interaction.reply({ embeds: [embed] });
		return;
	}

	if (commandName === 'order') {
		const ref = interaction.options.getString('reference', true);
		const order = getOrderByRef(ref);

		if (!order) {
			await interaction.reply({
				content: `❌ No order found matching reference \`#${ref}\`.`,
				ephemeral: true,
			});
			return;
		}

		const embed = buildOrderEmbed(order);
		const actionRow = buildOrderActionRow(order);
		await interaction.reply({ embeds: [embed], components: [actionRow] });
		return;
	}

	if (commandName === 'orders') {
		const statusFilter = interaction.options.getString('status') || 'ALL';
		const limit = interaction.options.getInteger('limit') || 10;
		const orders = getRecentOrders(limit, statusFilter);

		if (orders.length === 0) {
			await interaction.reply({
				content: `ℹ️ No orders found${statusFilter !== 'ALL' ? ` with status **${statusFilter}**` : ''}.`,
				ephemeral: true,
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setTitle(`📋 Recent Orders (${orders.length}) · Status: ${statusFilter}`)
			.setColor(BRAND_COLOR)
			.setFooter({ text: 'Use /order <reference> for complete details' });

		const lines = orders.map(o => {
			const badge = STATUS_EMOJIS[o.status] || o.status;
			const total = (o.grandTotal || 0).toLocaleString();
			const date = new Date(o.createdAt).toLocaleDateString('en-PH', {
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
			return `\`#${o.reference}\` • **₱${total}** • ${badge}\n👤 *${o.customer.name}* (${o.lines?.length || 1} items) — ${date}`;
		});

		embed.setDescription(lines.join('\n\n'));
		await interaction.reply({ embeds: [embed] });
		return;
	}

	if (commandName === 'status') {
		const ref = interaction.options.getString('reference', true);
		const newStatus = interaction.options.getString('new_status', true);
		const staffUser = interaction.user.tag || interaction.user.username;

		const updated = updateOrderStatus(ref, newStatus, staffUser);
		if (!updated) {
			await interaction.reply({
				content: `❌ Could not find order \`#${ref}\` to update.`,
				ephemeral: true,
			});
			return;
		}

		// Try updating the original Discord message in the channel if linked
		if (updated.discordMessageId && CHANNEL_ID) {
			try {
				const channel = await client.channels.fetch(CHANNEL_ID);
				if (channel?.isTextBased()) {
					const msg = await channel.messages.fetch(updated.discordMessageId);
					if (msg) {
						await msg.edit({
							embeds: [buildOrderEmbed(updated)],
							components: [buildOrderActionRow(updated)],
						});
					}
				}
			} catch (editErr) {
				console.warn('[Bot Notice] Could not update channel message directly:', editErr.message);
			}
		}

		await interaction.reply({
			content: `✅ Updated order \`#${ref}\` to **${STATUS_EMOJIS[newStatus] || newStatus}** (Recorded by @${staffUser}).`,
		});
	}
}

async function handleButton(interaction) {
	const customId = interaction.customId;
	if (!customId.startsWith('order_')) return;

	// format: order_<action>_<ref>
	const parts = customId.split('_');
	const action = parts[1]; // pack, ship, deliver, cancel
	const ref = parts.slice(2).join('_');

	const statusMap = {
		pack: 'PACKED',
		ship: 'SHIPPED',
		deliver: 'DELIVERED',
		cancel: 'CANCELLED',
	};

	const nextStatus = statusMap[action];
	if (!nextStatus) return;

	const staffUser = interaction.user.tag || interaction.user.username;
	const updated = updateOrderStatus(ref, nextStatus, staffUser);

	if (!updated) {
		await interaction.reply({
			content: `❌ Order \`#${ref}\` could not be located in database.`,
			ephemeral: true,
		});
		return;
	}

	// In-place edit of the order message
	const newEmbed = buildOrderEmbed(updated);
	const newRow = buildOrderActionRow(updated);

	await interaction.update({
		embeds: [newEmbed],
		components: [newRow],
	});

	await interaction.followUp({
		content: `✅ Order \`#${ref}\` status changed to **${STATUS_EMOJIS[nextStatus]}** by <@${interaction.user.id}>.`,
		ephemeral: true,
	});
}

/**
 * Lightweight HTTP server to receive orders from website or Worker
 */
function startHttpServer() {
	const server = http.createServer(async (req, res) => {
		// CORS headers
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

		if (req.method === 'OPTIONS') {
			res.writeHead(204);
			res.end();
			return;
		}

		const url = new URL(req.url, `http://${req.headers.host}`);

		if (req.method === 'GET' && url.pathname === '/health') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(
				JSON.stringify({
					status: 'ok',
					botOnline: client.isReady(),
					user: client.user?.tag || null,
					ordersCount: getOrderStats().totalOrders,
				}),
			);
			return;
		}

		if (req.method === 'POST' && url.pathname === '/api/order') {
			// Check optional API secret
			if (API_SECRET) {
				const auth = req.headers['authorization'];
				if (auth !== `Bearer ${API_SECRET}`) {
					res.writeHead(401, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}
			}

			let body = '';
			req.on('data', chunk => {
				body += chunk;
			});

			req.on('end', async () => {
				try {
					const data = JSON.parse(body);
					if (!data.reference || !data.customer) {
						res.writeHead(400, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ error: 'Missing required order fields' }));
						return;
					}

					// Format order structure
					const stored = saveOrder({
						reference: data.reference,
						createdAt: data.createdAt || new Date().toISOString(),
						status: 'PENDING',
						updatedAt: new Date().toISOString(),
						customer: data.customer,
						lines: data.lines || [],
						subtotal: data.subtotal || 0,
						shippingFee: data.shippingFee || 0,
						grandTotal: data.grandTotal || 0,
						paymentMethod: data.paymentMethod || 'cod',
						paymentReference: data.paymentReference,
						deliveryWindow: data.deliveryWindow || 'Standard delivery',
					});

					// Post alert to Discord channel
					let messageId = null;
					if (CHANNEL_ID) {
						try {
							const channel = await client.channels.fetch(CHANNEL_ID);
							if (channel?.isTextBased()) {
								const embed = buildOrderEmbed(stored);
								const row = buildOrderActionRow(stored);
								const sentMsg = await channel.send({
									content: `🚨 **NEW ORDER RECEIVED — KALYE NOIR STREETWEAR** \`#${stored.reference}\``,
									embeds: [embed],
									components: [row],
								});
								messageId = sentMsg.id;
								setOrderDiscordMessageId(stored.reference, messageId);
							}
						} catch (sendErr) {
							console.error('[Bot Alert] Failed to post message to channel:', sendErr);
						}
					}

					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(
						JSON.stringify({
							ok: true,
							reference: stored.reference,
							messageId,
						}),
					);
				} catch (parseErr) {
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
				}
			});
			return;
		}

		res.writeHead(404, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ error: 'Not Found' }));
	});

	server.listen(PORT, () => {
		console.log(`🌐 Bot HTTP endpoint listening at http://localhost:${PORT}`);
		console.log(`   • GET  /health`);
		console.log(`   • POST /api/order`);
	});
}

client.login(TOKEN).catch(err => {
	console.error('❌ Failed to login to Discord:', err);
});
