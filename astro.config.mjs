import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://deceive777xv.github.io',
  base: '/tsl-daily',
  output: 'static',
  trailingSlash: 'always',
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true,
    },
  },
});
