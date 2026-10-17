// Single source of truth for the Kalye Noir catalog.
// Product art lives in /public/assets/images/brand (sourced from /Assets).

export interface Variant {
  sku: string;
  color: string;
  size: string;
}

export interface Product {
  slug: string;
  title: string;
  image: string;
  alt: string;
  blurb: string;
  price: number;
  variants: Variant[];
}

export const ITEM_PRICE = 300;

// Every tee is black; the print is what sets it apart.
const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

function teeVariants(productSlug: string): Variant[] {
  return SIZES.map((size) => ({
    sku: `${productSlug}-${size.toLowerCase()}`,
    color: 'Black',
    size,
  }));
}

export const products: Product[] = [
  {
    slug: 'kalyenoir-tee',
    title: 'KALYENOIR Tee',
    image: '/assets/images/brand/tee-kalyenoir.png',
    alt: 'Kalye Noir KALYENOIR tee, front and back',
    blurb:
      'The wordmark, stacked three times across the back with a small chest mark. Heavyweight cotton, relaxed fit.',
    price: ITEM_PRICE,
    variants: teeVariants('kalyenoir-tee'),
  },
  {
    slug: 'medusa-tee',
    title: 'MEDUSA Tee',
    image: '/assets/images/brand/tee-medusa.png',
    alt: 'Kalye Noir MEDUSA tee, front and back',
    blurb:
      'MEDUSA — “Not your myth.” Full-back illustration print, beauty in chaos, on heavyweight black cotton.',
    price: ITEM_PRICE,
    variants: teeVariants('medusa-tee'),
  },
  {
    slug: 'manila-tee',
    title: 'MANILA Tee',
    image: '/assets/images/brand/tee-manila.png',
    alt: 'Kalye Noir MANILA tee, front and back',
    blurb:
      'A street-level photo print with “MANILA NEVER SLEEPS” across the back. Late nights, early dreams.',
    price: ITEM_PRICE,
    variants: teeVariants('manila-tee'),
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const findVariant = (slug: string, size: string) =>
  getProduct(slug)?.variants.find((v) => v.size === size);

export const uniqueSizes = (p: Product) => [...new Set(p.variants.map((v) => v.size))];
