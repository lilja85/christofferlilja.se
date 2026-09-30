// @ts-check
import { defineConfig } from 'astro/config';
import siteConfig from './site.config.mjs';

// https://astro.build/config
export default defineConfig({
  site: siteConfig.site.url,
  trailingSlash: 'ignore',
  // Skopade stilar utan extra specificitet, så att 2008-temat (src/styles/retro.css) kan skriva över dem
  scopedStyleStrategy: 'where',
});
