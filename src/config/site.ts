export const site = {
	name: 'KALYE NOIR',
	title: 'KALYE NOIR: Street Wear · Manila',
	description:
		'Kalye Noir: Manila streetwear built on heavyweight cotton. Three prints: KALYENOIR, MEDUSA and MANILA. Order by request, confirmed by email.',
} as const;

export const nav = [
	{ title: 'Home', href: '/' },
	{ title: "Kalye's Tee", href: '/products' },
	{ title: 'Contact Us', href: '/contact' },
] as const;

export const footerLists = [
	{
		title: 'Shop',
		items: [
			{ title: "Kalye's Tee", href: '/products' },
			{ title: 'KALYENOIR Tee', href: '/products/kalyenoir-tee' },
			{ title: 'MEDUSA Tee', href: '/products/medusa-tee' },
			{ title: 'MANILA Tee', href: '/products/manila-tee' },
		],
	},
	{
		title: 'Support',
		items: [
			{ title: 'Contact us', href: '/contact' },
			{ title: 'Incident report', href: '/incident-report' },
			{ title: 'Order summary', href: '/cart' },
			{ title: 'How ordering works', href: '/#how-it-works' },
		],
	},
];

export const contact = {
	name: 'KALYE NOIR',
	mobile: '+63 9xx xxx xxxx',
	email: 'kalyenoirorders@gmail.com',
	facebook: 'www.facebook.com/kalyenoir',
};
