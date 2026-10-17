import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://kalyenoir.com',
  devToolbar: { enabled: false },
  // ponytail: Astro 7 default. If inline text gap spacing regresses, switch to 'legacy'.
  compressHTML: 'jsx',
  integrations: [sitemap(), icon()],
  vite: { plugins: [tailwindcss()] },
});
