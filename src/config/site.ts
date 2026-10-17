export const site = {
  name: 'KALYE NOIR',
  title: 'KALYE NOIR — Street Wear · Manila',
  description:
    'Kalye Noir. Manila streetwear — heavyweight tees. KALYENOIR, MEDUSA and MANILA prints. Order now.',
  url: 'https://kalyenoir.com',
} as const;

export const nav = [
  { title: 'Home', href: '/' },
  { title: "Kalye's Tee", href: '/products' },
  { title: 'Contact Us', href: '/contact' },
] as const;

export const footerLists: {
  title: string;
  items: { title: string; href: string }[];
}[] = [
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
      { title: 'Contact Us', href: '/contact' },
      { title: 'Incident Report', href: '/incident-report' },
      { title: 'Your Cart', href: '/cart' },
      { title: 'Track an Order', href: '/contact' },
    ],
  },
];

export const taglines = ['Manila streets', 'Real dreams', 'Same sky'];

export const contact = {
  mobile: '09459864354',
  email: 'kalyenoirorders@gmail.com',
  facebook: 'www.facebook.com/kalyenoir',
  facebookUrl: 'https://www.facebook.com/kalyenoir',
};
