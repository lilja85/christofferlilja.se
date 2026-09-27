// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://christofferlilja.se',
  trailingSlash: 'ignore',
  // Skopade stilar utan extra specificitet, så att 2008-temat (src/styles/retro.css) kan skriva över dem
  scopedStyleStrategy: 'where',
});
