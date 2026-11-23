// Cross-island cart state. Persisted to localStorage so it survives reloads
// and page navigations; shared by every island via nanostores.
import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import { getSizePrice } from '../data/catalog.ts';

export interface CartItem {
	sku: string;
	slug: string;
	title: string;
	variant: string; // "Black / M"
	qty: number;
	unitPrice?: number;
}

export const isCartOpen = atom(false);

export const cartItems = persistentAtom<CartItem[]>('kalye-noir-cart', [], {
	encode: JSON.stringify,
	decode: JSON.parse,
});

export const cartCount = computed(cartItems, items =>
	items.reduce((n, i) => n + i.qty, 0),
);

// Free-text note carried from the cart to the checkout form.
export const orderNote = persistentAtom<string>('kalye-noir-note', '');

// Shipping estimate chosen in the cart, reused to prefill checkout.
export const shippingZoneId = persistentAtom<string>('kalye-noir-zone', '');
export const shippingProvince = persistentAtom<string>(
	'kalye-noir-province',
	'',
);


export function addToCart(item: CartItem) {
	const items = cartItems.get();
	const existing = items.find(i => i.sku === item.sku);
	cartItems.set(
		existing
			? items.map(i =>
					i.sku === item.sku ? { ...i, qty: i.qty + item.qty } : i,
				)
			: [...items, item],
	);
	isCartOpen.set(true);
}

export function removeFromCart(sku: string) {
	cartItems.set(cartItems.get().filter(i => i.sku !== sku));
}

export function setQty(sku: string, qty: number) {
	if (qty < 1) return removeFromCart(sku);
	cartItems.set(cartItems.get().map(i => (i.sku === sku ? { ...i, qty } : i)));
}

export function stepQty(sku: string, delta: number) {
	const current = cartItems.get().find(i => i.sku === sku);
	if (current) setQty(sku, current.qty + delta);
}

export function clearCart() {
	cartItems.set([]);
}

export function getCartItemPrice(item: CartItem): number {
	if (item.unitPrice && Number.isSafeInteger(item.unitPrice))
		return item.unitPrice;
	const size = item.variant.split(' · ').at(-1) ?? '';
	return getSizePrice(size);
}

export function cartSubtotal(items: CartItem[] = cartItems.get()): number {
	return items.reduce(
		(total, item) => total + getCartItemPrice(item) * item.qty,
		0,
	);
}
