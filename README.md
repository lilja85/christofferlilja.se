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

## Publicering

`.github/workflows/ci.yml` bygger, kör `npm audit` och deployar `dist/` till webbhotellet vid push till `main`.

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
Det finns 20 påskägg. `achievements` i terminalen visar hur många du hittat, och när alla är hittade blir det fest.
Temaknappen är rate limitad (3 byten/10 s), och två flikar som byter tema samtidigt ger en merge-konflikt (även `git pull`).
Koden finns i `public/js/site.js` (terminal, tema, PIM), `public/js/fx.js` (krasch, blåskärm, vim, säkerhetskontroll)
och `public/js/retro.js` (`theme 2008`), med stilar i `src/styles/`.

<details>
<summary><strong>⚠️ Spoilers: guide till alla 20 achievements</strong></summary>

Öppna terminalen med `.` (eller `§`/`` ` ``, tangenten under Esc). Kommandon skrivs i terminalen om inget annat står.
`achievements` visar vilka du har kvar, med ledtrådar.

**Tips om ordningen:** gör kraschen (7) och säkerhetskontrollen (9) sist bland sudo-äggen. Efter kraschen är sudo
spärrat tills kontrollen är klar.

| # | Achievement | Så här |
|---|---|---|
| 1 | Hello, world | Öppna terminalen med `.` |
| 2 | ↑↑↓↓←→←→BA | Knappa in Konami-koden på sidan (inte i terminalen): ↑ ↑ ↓ ↓ ← → ← → B A |
| 3 | RTFM | `sudo -l` |
| 4 | Least privilege hero | Aktivera sudo (skriv `sudo` på sidan, Konami-koden eller `sudo` i terminalen) och klicka på det öppna hänglåset uppe till höger |
| 5 | Sandwich artist | `sudo make me a sandwich` |
| 6 | Magic word | `rm -rf /` utan sudo |
| 7 | Blue screen of life | `sudo rm -rf /*` (eller `sudo rm -rf --no-preserve-root /`) |
| 8 | Escaped vim | `vim`, sedan `:q!` + Enter (`:wq!` fungerar också) |
| 9 | Back in sudoers | Efter kraschen: kör valfritt sudo-kommando och klara säkerhetskontrollen: svara `0.30000000000000004`, klicka Tabs, Spaces och sedan *Det som står i .editorconfig*, ta dig ur vim med `:q!`, klicka *Påminn approver* och sedan *Eskalera till chefen* |
| 10 | I can't do that, Dave | `sudo shutdown` |
| 11 | The only winning move | `sudo launch` |
| 12 | Have you tried… | `sudo reboot` |
| 13 | Good call | `sudo hire christoffer` |
| 14 | Best viewed in 1024×768 | `theme 2008` |
| 15 | Signera gästboken | Klicka på *Gästbok* i menyn i 2008-temat |
| 16 | 429 Too Many Requests | Klicka på temaknappen fyra gånger inom tio sekunder |
| 17 | Incident #4711 | Fortsätt klicka på temaknappen medan den är spärrad (sex klick till) |
| 18 | Conflict resolved | `git pull` eller `git merge dark` och välj valfri knapp. Eller: byt tema i två flikar inom 30 sekunder |
| 19 | Where the previews live | `git remote -v` |
| 20 | Not found | Gå till en sida som inte finns, till exempel `/finns-inte` |

När alla 20 är klara kommer fyrverkerierna och certifikatet. För musen över *Congratulations!* för fler,
och `achievements --celebrate` spelar upp finalen igen. `ragequit` ger upp och börjar om från noll
(efter en arkadnedräkning, CONTINUE?, där `j` fortsätter jakten och `n` ger upp), och `achievements --reset` nollställer direkt.

För den otålige: `Eggs.all().forEach(e => Eggs.unlock(e.id))` i webbläsarens konsol. Men det är fusk. 😉

</details>
