// Single source of truth for the Kalye Noir catalog.
// Product art lives in /public/assets/images/brand (sourced from /Assets).

export type CategoryId = 'shirts';

export interface Variant {
  sku: string;
  color: string;
  size: string;
  gender: string;
  stock: number;
}

export interface Product {
  slug: string;
  title: string;
  category: CategoryId;
  image: string;
  alt: string;
  blurb: string;
  variants: Variant[];
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Every tee is black; the print is what sets it apart.
const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

function teeVariants(productSlug: string, stock = 14): Variant[] {
  return SIZES.map((size) => ({
    sku: `${productSlug}-${slugify(size)}`,
    color: 'Black',
    size,
    gender: '',
    stock,
  }));
}

export const products: Product[] = [
  {
    slug: 'kalyenoir-tee',
    title: 'KALYENOIR Tee',
    category: 'shirts',
    image: '/assets/images/brand/tee-kalyenoir.png',
    alt: 'Kalye Noir KALYENOIR tee, front and back',
    blurb:
      'The wordmark, stacked three times across the back with a small chest mark. Heavyweight cotton, relaxed fit.',
    variants: teeVariants('kalyenoir-tee'),
  },
  {
    slug: 'medusa-tee',
    title: 'MEDUSA Tee',
    category: 'shirts',
    image: '/assets/images/brand/tee-medusa.png',
    alt: 'Kalye Noir MEDUSA tee, front and back',
    blurb:
      'MEDUSA — “Not your myth.” Full-back illustration print, beauty in chaos, on heavyweight black cotton.',
    variants: teeVariants('medusa-tee'),
  },
  {
    slug: 'manila-tee',
    title: 'MANILA Tee',
    category: 'shirts',
    image: '/assets/images/brand/tee-manila.png',
    alt: 'Kalye Noir MANILA tee, front and back',
    blurb:
      'A street-level photo print with “MANILA NEVER SLEEPS” across the back. Late nights, early dreams.',
    variants: teeVariants('manila-tee'),
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export function findVariant(slug: string, color: string, size: string, gender: string) {
  return getProduct(slug)?.variants.find(
    (v) => v.color === color && v.size === size && v.gender === gender
  );
}

export const uniqueColors = (p: Product) => [...new Set(p.variants.map((v) => v.color))];
export const uniqueSizes = (p: Product) => [...new Set(p.variants.map((v) => v.size))];
export const uniqueGenders = (p: Product) => [...new Set(p.variants.map((v) => v.gender))];
