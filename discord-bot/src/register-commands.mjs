import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
	console.error('❌ Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID in discord-bot/.env');
	console.error('Please copy .env.example to .env and fill in your credentials.');
	process.exit(1);
}

const commands = [
	new SlashCommandBuilder()
		.setName('orders')
		.setDescription('View recent Kalye Noir orders')
		.addStringOption(option =>
			option
				.setName('status')
				.setDescription('Filter orders by status')
				.setRequired(false)
				.addChoices(
					{ name: 'All', value: 'ALL' },
					{ name: 'Pending', value: 'PENDING' },
					{ name: 'Packed', value: 'PACKED' },
					{ name: 'Shipped', value: 'SHIPPED' },
					{ name: 'Delivered', value: 'DELIVERED' },
					{ name: 'Cancelled', value: 'CANCELLED' },
				),
		)
		.addIntegerOption(option =>
			option
				.setName('limit')
				.setDescription('Number of orders to display (1-25)')
				.setMinValue(1)
				.setMaxValue(25)
				.setRequired(false),
		),

	new SlashCommandBuilder()
		.setName('order')
		.setDescription('Look up full details of a specific order by reference')
		.addStringOption(option =>
			option
				.setName('reference')
				.setDescription('The order reference code (e.g. KN-M7A1-4X9B)')
				.setRequired(true),
		),

	new SlashCommandBuilder()
		.setName('status')
		.setDescription('Update the fulfillment status of an order')
		.addStringOption(option =>
			option
				.setName('reference')
				.setDescription('The order reference code')
				.setRequired(true),
		)
		.addStringOption(option =>
			option
				.setName('new_status')
				.setDescription('The new fulfillment status')
				.setRequired(true)
				.addChoices(
					{ name: '🟡 Pending', value: 'PENDING' },
					{ name: '📦 Packed', value: 'PACKED' },
					{ name: '🚚 Shipped', value: 'SHIPPED' },
					{ name: '✅ Delivered', value: 'DELIVERED' },
					{ name: '❌ Cancelled', value: 'CANCELLED' },
				),
		),

	new SlashCommandBuilder()
		.setName('stats')
		.setDescription('View Kalye Noir store analytics, revenue, and order volume'),

	new SlashCommandBuilder()
		.setName('catalog')
		.setDescription('Browse active Kalye Noir street tees catalog and pricing'),

	new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Test bot connectivity and latency'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

async function register() {
	try {
		console.log(`⏳ Registering ${commands.length} slash commands...`);

		if (guildId) {
			console.log(`Deploying to Guild (${guildId}) for instant update...`);
			await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
				body: commands,
			});
			console.log('✅ Successfully registered guild slash commands!');
		} else {
			console.log('Deploying globally (may take up to 1 hour to propagate)...');
			await rest.put(Routes.applicationCommands(clientId), {
				body: commands,
			});
			console.log('✅ Successfully registered global slash commands!');
		}
	} catch (error) {
		console.error('❌ Error registering slash commands:', error);
	}
}

register();
