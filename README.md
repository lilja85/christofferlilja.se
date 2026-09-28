# christofferlilja.se

Profilsida och labbanteckningar. Byggd med [Astro](https://astro.build) som statisk sida och publicerad till webbhotellet med GitHub Actions.

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
| `public/.htaccess` | www-omdirigering, teckenkodning och 404-sida (Apache) |
| `scripts/security-headers.mjs` | Säkerhetsheaders, som skrivs till `.htaccess` eller `_headers` vid bygget |

## Arbetsflöde

`main` är skyddad. Ändringar görs på en branch och går in via pull request:

1. `git switch -c feature/min-andring`, commit, `git push -u origin feature/min-andring`
2. Öppna en PR. CI bygger och Cloudflare lägger en förhandsvisning i PR:en.
3. Granska förhandsvisningen och merga. Mergen deployar till produktion.

## Publicering

`.github/workflows/ci.yml` bygger, kör `npm audit` och deployar `dist/` till webbhotellet när `main` uppdateras (efter merge).

1. Repo-variabel `DEPLOY_METHOD` = `ftps` (eller `ssh`).
2. Miljön `production` (endast `main`) med secrets `DEPLOY_PATH` och `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`
   (eller `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`).
3. Kör workflowen manuellt (Actions → CI → Run workflow). `dry_run` är förvalt och listar bara ändringarna.

Deployen synkar med radering: filer som inte finns i `dist/` tas bort från webbhotellet.

## Förhandsvisningar

Cloudflare Pages bygger varje branch och pull request och lägger en preview-URL i PR:en. Förhandsvisningarna
har samma säkerhetsheaders plus `X-Robots-Tag: noindex`, och en gul banner som visar branch och commit och länkar till
produktionen. Produktionen deployas bara från `main`, till webbhotellet.

## Påskägg

Tryck `.` (eller tangenten under Esc) för terminalen, och kör `help` och `sudo -l`.
Temaknappen är rate limitad (3 byten/10 s), och två flikar som byter tema samtidigt ger en merge-konflikt (även `git pull`).
Koden finns i `public/js/site.js` (terminal, tema, PIM), `public/js/fx.js` (krasch, blåskärm, vim, säkerhetskontroll)
och `public/js/retro.js` (`theme 2008`), med stilar i `src/styles/`.
