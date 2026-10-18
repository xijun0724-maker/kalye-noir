// Product art, keyed by slug. Lives here rather than in catalog.ts so the
// catalog stays plain TS — node --test can import it, but not a .png.
import type { ImageMetadata } from 'astro';
import teeKalyenoir from '../assets/images/brand/tee-kalyenoir.png';
import teeMedusa from '../assets/images/brand/tee-medusa.png';
import teeManila from '../assets/images/brand/tee-manila.png';

// Cart thumbnails use the full-size original (.src) because client islands can't
// call astro:assets at runtime. ponytail: lazy-loaded, ~80 KB per cart line; add
// build-time thumbs via getImage() if cart payload ever matters.
export const productArt: Record<string, ImageMetadata> = {
  'kalyenoir-tee': teeKalyenoir,
  'medusa-tee': teeMedusa,
  'manila-tee': teeManila,
};
