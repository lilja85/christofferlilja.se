# christofferlilja.se

Christoffers personliga sajt: profilsida + `/lab` med labbanteckningar + en hel del påskägg.
Astro 7, helt statisk, publiceras av Cloudflare Pages vid push till `main` på
`github.com/lilja85/christofferlilja.se` (**publikt repo**).

## Kommandon

```sh
npm run dev      # http://localhost:4321 (starta om efter nya filer i src/styles eller liknande)
npm run build    # måste gå igenom utan fel innan commit
npm run preview  # serverar dist/ som på Cloudflare (t.ex. index.html för mappar, som dev inte gör)
```

Windows: saknas `node` i PATH, lägg till `C:\Program Files\nodejs`.

## Struktur

- `src/pages/`: `index.astro` (profil), `lab/` (lista + `[...id].astro`), `404.astro`, `humans.txt.ts`,
  `.well-known/security.txt.ts` (textfiler som endpoints för att få `charset=utf-8`)
- `src/layouts/Base.astro`: layout, temaknapp, alla färgtokens (`--bg`, `--fg`, ...) och globala stilar
- `src/content/lab/*.md`: labbanteckningar, schema i `src/content.config.ts`
- `src/styles/retro.css` (2008-temat), `src/styles/fx.css` (sudo-effekter, terminal, merge-konflikt)
- `public/js/`: `theme-init.js` (blockerande i head), `fx.js` (effekter, `window.Fx`), `site.js`
  (tema, rate limit, PIM/sudo, terminal, git-kommandon), `retro.js` (2008-temats 00-talsdetaljer)
- `public/_headers`: säkerhetsheaders för Cloudflare
- `../public_html/` (syskonmapp) är den gamla PHP-sidan: rör den inte och publicera inget därifrån.

## Konventioner

- **CSP tillåter inga inline-skript.** All JavaScript ligger i `public/js/` och laddas med
  `<script is:inline src="..." defer>`. Skriv vanlig ES5-kompatibel vanilla-JS i samma stil som befintlig kod.
- **Specificitet:** `scopedStyleStrategy: 'where'` och `:where()` i dark-mode-regeln är avsiktliga, så att
  `.sudo` och `[data-theme='2008']` kan skriva över. Kontrollera sudo-läget i alla teman efter CSS-ändringar.
- **Tema-tillstånd:** `data-theme` på `<html>` (`light`/`dark`/`2008`/`gray`), `localStorage.theme` +
  `theme-meta` (synk mellan flikar), `sessionStorage.sudo-locked`, `html.sudo`, `html[data-fx]` = effekt pågår.
  Byt tema via `setTheme()` så att `themechange` skickas.
- Text på sidan är på svenska. Kommentarer i koden också.
- Påskäggen är en del av sajten, inte skräp. Bevara dem, och tänk på `prefers-reduced-motion`.

## Innehåll och integritet (publikt repo!)

- `draft: true` döljer bara inlägget på sajten, det är fullt läsbart i repot.
- Nämn inte var Christoffer jobbar just nu. Det är okej att säga "IAM/IGA" och "OpenText", men inte kunden.
- Inga personuppgifter (telefon, adress, födelsedatum), hemligheter, interna IP-adresser eller värdnamn.
- **Bilder:** ta bort metadata innan de committas (t.ex. `sharp(...).toFile()` utan `withMetadata`).
  Ett original med EXIF avslöjade en gång fotograf och arbetsgivare.
- Labbanteckningar skrivs med skillen `labbanteckning` (`.claude/skills/labbanteckning/`), med fast
  mall och säkerhetsgranskning.

## Git

- Committa med `git -c user.name="Christoffer Lilja" -c user.email="christoffer.lilja@gmail.com"`.
  Den globala git-konfigurationen har jobbadressen.
- **Pusha aldrig utan att fråga.** En push till `main` publicerar sajten via Cloudflare.
- CI (`.github/workflows/ci.yml`) kör bygge och `npm audit`. Actions är fastlåsta på SHA. Behåll det vid uppdateringar.

## Testa

Bygget räcker inte för UI-ändringar. Testa i webbläsaren med headless Edge via `puppeteer-core`
(installera det i en scratch-mapp, inte som beroende i projektet) mot `npm run preview` eller dev-servern.
Ta skärmdumpar i både ljust och mörkt tema och i mobilbredd.
