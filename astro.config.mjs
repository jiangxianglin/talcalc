import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://talcalc.com',
  output: 'static',
  trailingSlash: 'always',
  adapter: cloudflare({
    imageService: 'compile',
    // Routing: public/_routes.json (only /{class}/build/* hits the Worker)
  }),
  integrations: [
    tailwind({
      configFile: './tailwind.config.mjs',
    }),
    sitemap({
      filter: (page) => !page.includes('/build/'),
    }),
  ],
});
