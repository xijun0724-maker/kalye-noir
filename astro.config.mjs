import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://kalyenoir.com',
  devToolbar: { enabled: false },
  integrations: [tailwind({ applyBaseStyles: false }), sitemap(), icon()],
});
