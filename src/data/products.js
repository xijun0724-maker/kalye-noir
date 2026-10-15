// Single source of truth for Kalye Noir products.
// No prices: pricing is confirmed per order (see PRODUCT.md).

export const categories = [
	{
		id: 'shirts',
		title: 'Oversized Shirts',
		blurb: 'Front & back print · S–2XL',
	},
	{
		id: 'pouch',
		title: 'Trinket Pouch',
		blurb: 'Customizable · made to request',
	},
];

export const products = [
	{
		slug: 'medusa-tee',
		id: 'tee-medusa',
		name: 'Kalye Noir Tee — MEDUSA',
		short: 'MEDUSA',
		category: 'shirts',
		meta: 'Oversized · Front & back print',
		blurb: 'Medusa in halftone, the Gorgon stare, “not your myth.” Front chest mark, full back print.',
		img: '/assets/images/brand/tee-medusa.png',
		alt: 'Kalye Noir MEDUSA tee — front and back print',
		sizes: ['S', 'M', 'L', 'XL', '2XL'],
	},
	{
		slug: 'maynila-tee',
		id: 'tee-maynila',
		name: 'Kalye Noir Tee — MAYNILA',
		short: 'MAYNILA',
		category: 'shirts',
		meta: 'Oversized · Front & back print',
		blurb: 'The Divisoria street scene — jeepney, wires, lanterns — set under “MANILA NEVER SLEEPS.”',
		img: '/assets/images/brand/tee-maynila.png',
		alt: 'Kalye Noir MAYNILA tee — front and back print',
		sizes: ['S', 'M', 'L', 'XL', '2XL'],
	},
	{
		slug: 'kalyenoir-tee',
		id: 'tee-kalyenoir',
		name: 'Kalye Noir Tee — KALYENOIR',
		short: 'KALYENOIR',
		category: 'shirts',
		meta: 'Oversized · Front & back print',
		blurb: 'The stacked KALYENOIR wordmark over the wreathed Manila wires. “NASA KALYE NANGANGARAP.”',
		img: '/assets/images/brand/tee-kalyenoir.png',
		alt: 'Kalye Noir KALYENOIR tee — front and back print',
		sizes: ['S', 'M', 'L', 'XL', '2XL'],
	},
	{
		slug: 'good-things-inside-pouch',
		id: 'pouch-custom',
		name: 'GOOD THINGS INSIDE Trinket Pouch',
		short: 'GOOD THINGS INSIDE',
		category: 'pouch',
		meta: 'Customizable · made to request',
		blurb: 'Zip pouch with the GOOD THINGS INSIDE label. Pick your colour, patch and cord — made to your style.',
		img: '/assets/images/brand/pouch.png',
		alt: 'Kalye Noir GOOD THINGS INSIDE trinket pouch',
		sizes: ['Custom'],
	},
];

export const getProduct = (slug) => products.find((p) => p.slug === slug);

export const productsByCategory = (categoryId) =>
	products.filter((p) => p.category === categoryId);
