// Kalye Noir cart: localStorage-backed, drawer + cart page, header badge, checkout handoff.
// Plain JS (not TS) — processed directly by esbuild inside Astro script bundles.
const KEY = 'kn-cart';

// submitting the Netlify order form navigates here — clear the cart
const isThankYou = () => /order-thank-you\/?$/i.test(location.pathname);

let items = load();

function load() {
	if (isThankYou()) {
		localStorage.removeItem(KEY);
		return [];
	}
	try {
		const raw = localStorage.getItem(KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function save() {
	localStorage.setItem(KEY, JSON.stringify(items));
	document.dispatchEvent(new CustomEvent('kn-cart:change'));
}

export function getCart() {
	return items;
}

export function addToCart(item) {
	const existing = items.find((i) => i.id === item.id && i.size === item.size);
	if (existing) {
		existing.qty += item.qty;
	} else {
		items.push({ ...item });
	}
	save();
}

export function removeFromCart(id, size) {
	items = items.filter((i) => !(i.id === id && i.size === size));
	save();
}

export function changeQty(id, size, delta) {
	const item = items.find((i) => i.id === id && i.size === size);
	if (!item) return;
	item.qty = Math.max(1, item.qty + delta);
	save();
}

export function cartCount() {
	return items.reduce((n, i) => n + i.qty, 0);
}

export function cartSummary() {
	if (!items.length) return '';
	return items.map((i) => `• ${i.qty}× ${i.name} (size ${i.size})`).join('\n');
}

// small API for page scripts — this module is loaded once per page (Page.astro),
// so page scripts call window.KN instead of importing it again (avoids a second
// module instance with its own stale cart state).
if (typeof window !== 'undefined') {
	window.KN = { addToCart, removeFromCart, changeQty, getCart, cartCount, cartSummary };
}

function lineHtml(i) {
	return `
		<div class="cart-line" data-id="${i.id}" data-size="${i.size}">
			<img src="${i.img}" alt="" width="64" height="80" loading="lazy" />
			<div class="cart-line__info">
				<p class="cart-line__name">${i.name}</p>
				<p class="cart-line__meta">Size ${i.size}</p>
			</div>
			<div class="cart-line__qty">
				<button type="button" data-qty="-1" aria-label="Decrease quantity">−</button>
				<span>${i.qty}</span>
				<button type="button" data-qty="1" aria-label="Increase quantity">+</button>
			</div>
			<button type="button" class="cart-line__remove" data-remove aria-label="Remove ${i.name}">×</button>
		</div>`;
}

function emptyHtml() {
	return `<p class="cart-drawer__empty">Your cart is empty — NASA kalye nangangarap. <a href="/products">Shop the line</a></p>`;
}

// renders into every cart list on the page (drawer + cart page)
function renderLists() {
	const lists = document.querySelectorAll('[data-cart-items]');
	if (!lists.length) return;
	const html = items.length ? items.map(lineHtml).join('') : emptyHtml();
	lists.forEach((list) => (list.innerHTML = html));
}

// header badge + any text counts (drawer, cart page, checkout)
function renderCounts() {
	const n = cartCount();
	document.querySelectorAll('[data-cart-count]').forEach((badge) => {
		badge.textContent = n > 0 ? String(n) : '';
		n === 0 ? badge.setAttribute('hidden', '') : badge.removeAttribute('hidden');
	});
	document.querySelectorAll('[data-cart-count-text]').forEach((el) => {
		el.textContent = String(n);
	});
}

function render() {
	renderLists();
	renderCounts();
}

function openDrawer() {
	document.body.classList.add('cart-open');
	renderLists();
	const drawer = document.querySelector('[data-cart-drawer]');
	if (drawer) drawer.setAttribute('open', '');
}

function closeDrawer() {
	document.body.classList.remove('cart-open');
	const drawer = document.querySelector('[data-cart-drawer]');
	if (drawer) drawer.removeAttribute('open');
}

function syncOrderForm() {
	const form = document.querySelector('form[name="order"]');
	if (!form) return;
	const hidden = form.querySelector('input[name="cart-contents"]');
	if (hidden) hidden.value = cartSummary();
}

// one delegated handler per list container; survives innerHTML re-renders
function bindListEvents() {
	document.querySelectorAll('[data-cart-items]').forEach((list) => {
		list.addEventListener('click', (e) => {
			const target = e.target;
			const line = target.closest('.cart-line');
			if (!line) return;
			const { id, size } = line.dataset;
			if (target.closest('[data-remove]')) {
				removeFromCart(id, size);
				return;
			}
			const qtyBtn = target.closest('[data-qty]');
			if (qtyBtn) {
				changeQty(id, size, Number(qtyBtn.dataset.qty));
			}
		});
	});
}

export function initCart() {
	if (isThankYou()) return;

	bindListEvents();
	renderCounts();
	renderLists();
	syncOrderForm();

	document.querySelectorAll('[data-cart-open]').forEach((btn) =>
		btn.addEventListener('click', openDrawer)
	);
	document.querySelectorAll('[data-cart-close]').forEach((btn) =>
		btn.addEventListener('click', closeDrawer)
	);
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') closeDrawer();
	});
	document.addEventListener('kn-add', () => {
		render();
		openDrawer();
	});
	document.addEventListener('kn-cart:change', () => {
		render();
		syncOrderForm();
	});

	// keep the checkout's hidden cart field current at submit time
	const orderForm = document.querySelector('form[name="order"]');
	if (orderForm) orderForm.addEventListener('submit', syncOrderForm);
}

// auto-init on every page
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initCart);
} else {
	initCart();
}
