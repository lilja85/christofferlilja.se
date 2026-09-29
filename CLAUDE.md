# christofferlilja.se

Christoffers personliga sajt: profilsida + `/lab` med labbanteckningar + en hel del påskägg.
Astro 7, helt statisk. GitHub Actions bygger och deployar `dist/` till webbhotellet (Inleed,
DirectAdmin, nginx framför Apache) vid push till `main` på `github.com/lilja85/christofferlilja.se`
(**publikt repo**).

## Kommandon

```sh
npm run dev      # http://localhost:4321 (starta om efter nya filer i src/styles eller liknande)
npm run build    # måste gå igenom utan fel innan commit
npm run preview  # serverar dist/ som i produktion (t.ex. index.html för mappar, som dev inte gör)
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
- `scripts/security-headers.mjs`: **enda källan** för säkerhetsheaders (CSP, HSTS m.fl.). Ändra dem här.
- `scripts/postbuild.mjs` (körs av `npm run build`): skriver headers till `dist/.htaccess` (webbhotellet) eller,
  när `CF_PAGES` är satt, till `dist/_headers` med noindex och tar bort `.htaccess` (Cloudflare-förhandsvisning).
- `scripts/make-hacker-avatar.mjs`: genererar `src/assets/profil-hacker.png` (grön terminalversion av profilbilden som visas i sudo-läge). Kör om om profilbilden byts.
- `public/.htaccess`: www-omdirigering, `charset=utf-8`, 404-sida och markören `# @security-headers`, som
  postbuild ersätter. Ta inte bort markören, då fallerar bygget med flit.
- `.github/workflows/ci.yml`: bygge + `npm audit`, sedan deploy-jobbet (se Deploy nedan)
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
- **Påskäggsjakten:** alla ägg är listade i `public/js/achievements.js` (id, titel, beskrivning, ledtråd) och sparas
  i `localStorage.eggs`. Ett nytt ägg läggs till där och låses upp med `window.Eggs.unlock('id')` där det utlöses.
  Antalet visas i terminalen (`achievements`), sidfoten och konsolhälsningen, så uppdatera "20" i konsoltexten om antalet ändras.
  När alla är hittade kommer fyrverkerier och ett certifikat (`Eggs.celebrate()`).
- **Topplistan (hall of fame):** `src/data/hall-of-fame.json`, fylls på via PR:er från besökare. `scripts/validate-hall-of-fame.mjs`
  körs i CI och kontrollerar format, kontrollsumma (`id`, samma beräkning som `hofId` i `achievements.js`) och, i PR:er, att bara
  filen ändras, exakt en post tillkommer och att posten gäller PR-författaren. PR-kontrollerna gäller inte PR:er från
  repots ägare. Kontrollsumman bygger på en fast fras (`HOF_SALT`, "Hello, friend." från Mr. Robot), inte på äggen, så
  nya ägg påverkar inte befintliga poster (formeln finns i `scripts/hof-id.mjs`). Topplist-PR:er mergas manuellt av Christoffer.
  Den som mejlar via "Berätta för mig" läggs in med `node scripts/hof-add.mjs <github-alias> <completed>`, som räknar ut `id`.
- CI kör `pull_request`, inte `pull_request_target`: fork-PR:er får inga secrets. Läs PR-data via `env`, aldrig direkt i `run:`.
- Repot ska ha *Require approval for all external contributors* (Settings → Actions → General). Med standardvalet
  *first-time contributors* körs CI automatiskt för alla som fått en PR mergad, alltså alla på topplistan, och de kan
  ändra workflowen i sin PR (utan secrets, men med runner-tid). Godkännandet gäller bara CI; vem som kan ändra koden
  styrs av rulesetet på `main`.

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
- **`main` är skyddad.** Allt går via branch → pull request → förhandsvisning på Cloudflare → merge.
  Merge till `main` deployar till produktion. Direktpush och force-push till `main` blockeras av en
  ruleset på GitHub och av `permissions.deny` i `.claude/settings.json`. Försök inte gå runt dem.
- Branchnamn: `feature/…` för nytt, `fix/…` för buggar, `chore/…` för underhåll och dokumentation.
- Pusha feature-brancher bara efter att ha frågat. Öppna PR:en på GitHub (ingen `gh` CLI installerad) och
  länka den. Mergen gör Christoffer.
- CI (`.github/workflows/ci.yml`) kör bygge och `npm audit`. Actions är fastlåsta på SHA. Behåll det vid uppdateringar.

## Deploy

- **Två miljöer:** produktion = webbhotellet (GitHub Actions + FTPS från `main`). Förhandsvisning =
  Cloudflare Pages, som bygger alla branches och PR:er med `noindex` och lägger preview-URL:en i PR:en.
  Arbetsflöde för större ändringar: branch → PR → granska previewn → merge (som deployar).
- `Base.astro` läser `CF_PAGES`, `CF_PAGES_BRANCH` och `CF_PAGES_COMMIT_SHA` vid bygget. På Cloudflare visas en gul
  banner (branch, commit, länk till produktionen) och `<html data-env="preview">`. Terminalen använder `data-env`
  (`git remote -v`, `open preview|production`, `uname`).

- **Push till `main` deployar direkt** till produktion. Före ändringar som tar bort eller flyttar filer:
  kör workflowen manuellt (`workflow_dispatch`, `dry_run` förvalt) och granska listan först.
- Produktion använder **FTPS** (`DEPLOY_METHOD=ftps`) med ett FTP-konto som bara når `public_html`.
  SSH finns på webbhotellet men utan rsync, och SFTP fungerar bara med huvudkontot, som når allt. SSH-grenen i
  workflowen finns kvar om det ändras.
- Deploy-jobbet i `ci.yml` körs från `main` när repo-variabeln `DEPLOY_METHOD` är `ftps` eller `ssh`.
  Uppgifterna är secrets i GitHub-miljön `production`: `DEPLOY_PATH` plus `FTP_HOST`/`FTP_USER`/`FTP_PASSWORD`
  (FTPS) eller `DEPLOY_HOST`/`DEPLOY_USER`/`DEPLOY_SSH_KEY`/`DEPLOY_KNOWN_HOSTS` (SSH, valfri variabel `DEPLOY_PORT`).
- Synken **raderar** filer som inte finns i `dist/` (undantag: `.well-known/acme-challenge/`, `cgi-bin/`).
  Kör manuellt med `dry_run` (standard vid manuell körning) innan ändringar som flyttar eller tar bort filer.
- `upload-artifact` behöver `include-hidden-files: true`, annars saknas `.htaccess` och `.well-known/`.
- HTTPS-omdirigering görs i DirectAdmin ("Force SSL"), inte i `.htaccess` (loop bakom nginx).

## Testa

Bygget räcker inte för UI-ändringar. Testa i webbläsaren med headless Edge via `puppeteer-core`
(installera det i en scratch-mapp, inte som beroende i projektet) mot `npm run preview` eller dev-servern.
Ta skärmdumpar i både ljust och mörkt tema och i mobilbredd.
