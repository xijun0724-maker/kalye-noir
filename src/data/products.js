// Single source of truth for Kalye Noir products.
// No prices: pricing is confirmed per order (see PRODUCT.md).

export const categories = [
	{
		id: 'shirts',
		title: 'Oversized Shirts',
		blurb: 'Front & back print · S–2XL',
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
];

export const getProduct = (slug) => products.find((p) => p.slug === slug);

export const productsByCategory = (categoryId) =>
	products.filter((p) => p.category === categoryId);
