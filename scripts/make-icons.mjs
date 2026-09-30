// Engångsskript: gör favicon.svg, favicon.ico och apple-touch-icon.png med initialerna från site.config.mjs.
// Samma färger som sajten (ljust och mörkt tema). Har du en egen ikon: lägg den i public/ och hoppa över skriptet.
// Kör: node scripts/make-icons.mjs
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import siteConfig from '../site.config.mjs';

const { firstName, lastName } = siteConfig.person;
const initials = (firstName[0] + lastName[0]).toUpperCase();
const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

const svg = (dark) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    .bg { fill: #1f6f5c; }
    .fg { fill: #ffffff; }${dark ? `
    @media (prefers-color-scheme: dark) {
      .bg { fill: #5cc5a7; }
      .fg { fill: #141517; }
    }` : ''}
  </style>
  <rect class="bg" width="32" height="32" rx="7" />
  <text class="fg" x="16" y="21.5" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="15" font-weight="700">${initials}</text>
</svg>
`;

// SVG:n följer webbläsarens tema; PNG/ICO får det ljusa utseendet
writeFileSync(out('favicon.svg'), svg(true));
const png = (size) => sharp(Buffer.from(svg(false)), { density: 72 * (size / 32) * 4 }).resize(size, size).png().toBuffer();

writeFileSync(out('apple-touch-icon.png'), await png(180));

// ICO med PNG-bilder inuti (stöds av alla moderna webbläsare)
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(png));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(size, e);
  header.writeUInt8(size, e + 1);
  header.writeUInt16LE(1, e + 4); // färgplan
  header.writeUInt16LE(32, e + 6); // bitar per pixel
  header.writeUInt32LE(images[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += images[i].length;
});
writeFileSync(out('favicon.ico'), Buffer.concat([header, ...images]));
console.log(`Ikoner med "${initials}" skrivna till public/`);
