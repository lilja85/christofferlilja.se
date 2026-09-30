// Engångsskript: gör en "hacker"-version av profilbilden som visas i sudo-läget.
// Grön duoton med få tonnivåer, grova pixlar, scanlines och vinjett, som en gammal terminalskärm.
// Kör: node scripts/make-hacker-avatar.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../src/assets/avatar.jpg', import.meta.url));
const OUT = fileURLToPath(new URL('../src/assets/avatar-hacker.png', import.meta.url));

const SIZE = 128; // antal "pixlar" på bredden
const SCALE = 3; // uppskalning utan utjämning (384 px)
const LEVELS = 6; // antal gröna tonnivåer
const DARK = [2, 7, 3]; // #020703
const LIGHT = [110, 255, 140]; // ljusaste grönt

const { data } = await sharp(SRC).resize(SIZE, SIZE).greyscale().normalise().raw().toBuffer({ resolveWithObject: true });

const W = SIZE * SCALE;
const out = Buffer.alloc(W * W * 3);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    // Vinjett runt ansiktet: den ljusa väggen bakom blir mörk
    const dx0 = x / SIZE - 0.5;
    const dy0 = y / SIZE - 0.45;
    const vignette = Math.max(0, Math.min(1, 1.9 - Math.hypot(dx0, dy0) * 3.6));
    let v = Math.pow(data[y * SIZE + x] / 255, 1.3) * vignette;
    v = Math.round(v * (LEVELS - 1)) / (LEVELS - 1); // posterisering
    for (let dy = 0; dy < SCALE; dy++) {
      for (let dx = 0; dx < SCALE; dx++) {
        const py = y * SCALE + dy;
        const px = x * SCALE + dx;
        const scan = py % 3 === 2 ? 0.55 : 1; // scanlines
        const color = DARK.map((d, i) => Math.round(d + (LIGHT[i] - d) * v * scan));
        out.set(color, (py * W + px) * 3);
      }
    }
  }
}

await sharp(out, { raw: { width: W, height: W, channels: 3 } }).png({ palette: true, colours: 16 }).toFile(OUT);
console.log('skrev', OUT);
