import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readAllOrders() {
	try {
		if (!fs.existsSync(ORDERS_FILE)) {
			return [];
		}
		const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
		return JSON.parse(raw);
	} catch (err) {
		console.error('[Orders DB] Failed to read orders file:', err);
		return [];
	}
}

function writeAllOrders(orders) {
	try {
		fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
	} catch (err) {
		console.error('[Orders DB] Failed to write orders file:', err);
	}
}

/**
 * Persists an order or updates it if reference exists
 */
export function saveOrder(order) {
	const orders = readAllOrders();
	const existingIdx = orders.findIndex(
		o => o.reference?.toUpperCase() === order.reference?.toUpperCase(),
	);
	if (existingIdx >= 0) {
		orders[existingIdx] = { ...orders[existingIdx], ...order };
	} else {
		orders.unshift(order);
	}
	writeAllOrders(orders);
	return order;
}

/**
 * Look up an order by reference
 */
export function getOrderByRef(reference) {
	const orders = readAllOrders();
	const target = reference.trim().toUpperCase();
	return orders.find(o => o.reference?.toUpperCase() === target);
}

/**
 * Update an order's status
 */
export function updateOrderStatus(reference, newStatus, updatedBy) {
	const orders = readAllOrders();
	const target = reference.trim().toUpperCase();
	const idx = orders.findIndex(o => o.reference?.toUpperCase() === target);
	if (idx === -1) return null;

	orders[idx].status = newStatus;
	orders[idx].updatedAt = new Date().toISOString();
	orders[idx].updatedBy = updatedBy;
	writeAllOrders(orders);
	return orders[idx];
}

/**
 * Attach discord message ID to stored order
 */
export function setOrderDiscordMessageId(reference, messageId) {
	const orders = readAllOrders();
	const target = reference.trim().toUpperCase();
	const idx = orders.findIndex(o => o.reference?.toUpperCase() === target);
	if (idx >= 0) {
		orders[idx].discordMessageId = messageId;
		writeAllOrders(orders);
	}
}

/**
 * Retrieve recent orders
 */
export function getRecentOrders(limit = 10, statusFilter) {
	let orders = readAllOrders();
	if (statusFilter && statusFilter.toUpperCase() !== 'ALL') {
		orders = orders.filter(o => o.status === statusFilter.toUpperCase());
	}
	return orders.slice(0, limit);
}

/**
 * Compute store summary stats
 */
export function getOrderStats() {
	const orders = readAllOrders();
	const totalRevenue = orders.reduce(
		(sum, o) => (o.status !== 'CANCELLED' ? sum + (o.grandTotal || 0) : sum),
		0,
	);
	const totalItemsSold = orders.reduce(
		(sum, o) =>
			o.status !== 'CANCELLED'
				? sum +
					(o.lines || []).reduce((sub, l) => sub + (l.quantity || 1), 0)
				: sum,
		0,
	);
	const codOrders = orders.filter(o => o.paymentMethod === 'cod').length;
	const gcashOrders = orders.filter(o => o.paymentMethod !== 'cod').length;

	const countsByStatus = {
		PENDING: orders.filter(o => o.status === 'PENDING').length,
		PACKED: orders.filter(o => o.status === 'PACKED').length,
		SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
		DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
		CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
	};

	return {
		totalOrders: orders.length,
		totalRevenue,
		totalItemsSold,
		codOrders,
		gcashOrders,
		countsByStatus,
	};
}
