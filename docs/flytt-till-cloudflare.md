# Flytt av produktionen till Cloudflare Pages

Planerad, inte påbörjad. Skäl: webbhotellets nginx svarar själv på större statiska filer utan headers från
`.htaccess`, och det går inte att ändra på ett delat webbhotell (besked från Inleed 2026-10-01). Startsidan
går via Apache som `index.php` i väntan på flytten. Cloudflare Pages bygger redan alla brancher och sätter
headers på alla filer via `_headers`.

Domänregistreringen, teknikdagboken.se och e-posten kan ligga kvar hos Inleed. Det som flyttar är
namnservrarna för christofferlilja.se och var sajten serveras.

## 1. DNS (görs först, det tar tid)

- [ ] Exportera **hela** zonen från DirectAdmin. Läget 2026-10-01:
  - NS `ns1`–`ns6.inleed.net`
  - MX `mail.christofferlilja.se` (e-post hos Inleed, ska fungera som förut)
  - SPF `v=spf1 a mx include:spf.inleed.se ip4:86.106.25.100 -all`
  - apex och www pekar på `86.106.25.100` / `2001:67c:750::29`
  - DKIM (`*._domainkey`), DMARC och övriga poster syns inte utifrån, så ta dem från exporten
- [ ] **DNSSEC:** stäng av hos Inleed (ta bort DS-posten) och vänta ut TTL:en innan namnservrarna byts.
  Annars slutar domänen fungera för alla som validerar DNSSEC.
- [ ] Lägg till zonen i Cloudflare och kontrollera att alla poster kom med. `mail` (och det e-posten behöver)
  ska peka på Inleed och vara **DNS only** (grått moln), inte proxas.
- [ ] SPF: `a` pekar på apex, som flyttar till Cloudflare. `ip4:86.106.25.100` täcker mejlservern ändå, men
  kontrollera att utgående e-post fortfarande godkänns.
- [ ] Byt namnservrar hos Inleed till Cloudflares. Aktivera sedan DNSSEC i Cloudflare och lägg in DS-posten hos Inleed.

## 2. Cloudflare Pages

- [ ] Produktionsbranch `main`, egen domän `christofferlilja.se`. www → apex med en Redirect Rule (301).
- [ ] Always Use HTTPS och HSTS på. Överväg HSTS preload när allt är stabilt.
- [ ] Kontrollera att PR:er från forkar **inte** byggs automatiskt (repot tar emot topplist-PR:er).
- [ ] Cloudflares Git-koppling deployar `main` direkt vid merge, precis som Actions gör i dag. Inget extra
  godkännande (*Required reviewers* provades och togs bort), så ingen API-token eller deploy från Actions behövs.
- [ ] Node-version och byggkommando som i CI (`npm run build`).
- [ ] Alla headers i `scripts/security-headers.mjs` (även Cross-Origin-Opener-Policy och
  Cross-Origin-Resource-Policy) skrivs till `_headers` av postbuild. Lägg inte in headers i Cloudflares
  inställningar (Transform Rules) också, då finns de på två ställen.

## 3. Koden

- [ ] `scripts/postbuild.mjs`: på Cloudflare blir `CF_PAGES_BRANCH === 'main'` produktion. `_headers` utan
  `X-Robots-Tag: noindex` för `main`, med noindex för övriga brancher.
- [ ] `src/layouts/Base.astro`: banner och `data-env="preview"` bara för andra brancher än `main`.
  Terminalen (`uname`, `git remote -v`, `open preview|production`) läser `data-env`; uppdatera texten
  "produktion på webbhotellet" i `public/js/site.js`.
- [ ] Ta bort `index.php`-lösningen: `site.phpIndex` (site.config.mjs, config-types.ts), blocket i
  postbuild, `DirectoryIndex index.php` i `public/.htaccess`. Behåll `<` som `<` i JSON:en, det är bra ändå.
- [ ] `.htaccess` behövs inte på Cloudflare (404-sidan hittas automatiskt, HTTPS och www sköts av Cloudflare).
  Bestäm om den ska vara kvar för den som forkar och kör på ett webbhotell.
- [ ] `scripts/check-live-headers.mjs`: kräv headers på alla adresser igen (ta bort `REQUIRED`/varningarna).
- [ ] Ta bort meta-taggarna för CSP och Referrer-Policy i `Base.astro` (och kommentaren om dem i
  `security-headers.mjs`). De är ett reservskydd för sidorna som webbhotellets nginx skickar utan headers.
  På Cloudflare får alla filer riktiga headers, så taggarna gör inget extra. Däremot blir det två ställen
  där CSP:n gäller: en lättare CSP för en enskild sida, eller sådant som bara fungerar i headers (som
  `report-to`), skulle fortfarande stoppas av meta-taggen och vara svårt att felsöka.
- [ ] `.github/workflows/ci.yml`: deploy-jobbet körs inte utan `DEPLOY_METHOD`. Ta bort det eller behåll det
  för forkar; headerkontrollen efter deploy behöver i så fall flyttas (t.ex. till `headers.yml` efter
  Cloudflares bygge).
- [ ] `site.config.mjs`: `humans.hosting` ("GitHub Actions och FTPS till mitt webbhotell").

## 4. Städa efter flytten

- [ ] Ta bort repo-variabeln `DEPLOY_METHOD`, miljön `production` och dess secrets (`DEPLOY_PATH`, `FTP_*`) i GitHub.
- [ ] Ta bort FTP-kontot hos Inleed och töm `public_html` för domänen (behåll det som e-posten behöver).
- [ ] README (Publicering, Förhandsvisningar), `CLAUDE.md` (Deploy) och labbanteckningen om deployen.
  Labbanteckningen finns som utkast i `src/content/lab/flytt-till-cloudflare-pages.md`: fyll i ✍️-rutorna.

## Klart när

- [ ] `node scripts/check-live-headers.mjs` är grön för alla adresser, utan varningar.
- [ ] https://securityheaders.com/?q=christofferlilja.se&followRedirects=on ger A+.
- [ ] E-post till och från @christofferlilja.se fungerar, och DNSSEC validerar (t.ex. dnsviz.net).
- [ ] Påskäggen fungerar på produktionen, inklusive `git remote -v` och `uname`.
