# christofferlilja.se

Profilsida och labbanteckningar. Byggd med [Astro](https://astro.build) som statisk sida och publicerad på Cloudflare Pages.

## Kom igång

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # bygger till ./dist
npm run preview
```

## Struktur

| Sökväg | Innehåll |
|---|---|
| `src/pages/index.astro` | Profilsidan |
| `src/content/lab/*.md` | Labbanteckningar (`draft: true` döljer ett inlägg) |
| `src/site.ts` | Namn, titel, länkar |
| `public/cv/Christoffer_Lilja-CV.pdf` | CV:t. Länken visas bara om filen finns |
| `public/_headers` | Säkerhetsheaders (Cloudflare Pages) |

## Publicering (Cloudflare Pages)

Workers & Pages → Create → Pages → Connect to Git → välj repot.
Build command `npm run build`, output `dist`, miljövariabel `NODE_VERSION=24`.
Lägg sedan till `christofferlilja.se` och `www.christofferlilja.se` under Custom domains.

## Påskägg

Tryck `.` (eller tangenten under Esc) för terminalen, och kör `help` och `sudo -l`.
Koden finns i `public/js/site.js` (terminal, tema, PIM), `public/js/fx.js` (krasch, blåskärm, vim, säkerhetskontroll)
och `public/js/retro.js` (`theme 2008`), med stilar i `src/styles/`.
