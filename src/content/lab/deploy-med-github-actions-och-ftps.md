---
title: 'Deploy med GitHub Actions och FTPS till ett vanligt webbhotell'
description: 'Hur min statiska Astro-sida byggs i GitHub Actions och synkas till webbhotellet med minsta möjliga behörighet, varför det inte blev Cloudflare, GitHub Pages eller SSH, och varför betyget för säkerhetsheaders ändå föll från A+ till F.'
date: 2026-09-28
tags: [devsecops, github-actions, deploy, claude-code, säkerhet]
draft: false
---

<!--
  UTKAST skapat med Claude Code. Fyll i ✍️-rutorna och ta bort draft: true när du är nöjd.
  Säkerhetsgranskat: inga användarnamn, lösenord, nycklar eller interna sökvägar utöver standardkataloger.
  Publicera inte förrän fix/sakerhetsheaders är mergad och securityheaders.com visar A+ igen:
  "När A+ blev F" beskriver index.php, meta-taggarna och kontrollen med GET som färdiga.
-->

När jag [byggde om den här sidan](/lab/fran-php-till-astro-med-claude-code/) återstod en sak: att få ut
den på min domän. Det slutade med att GitHub Actions bygger sidan och synkar den till mitt vanliga
webbhotell över FTPS. Det låter kanske lite 2008, men det visade sig vara det alternativ som gav **minst
behörighet**. Precis som förra gången gjorde jag det tillsammans med Claude Code. Några dagar senare visade
det sig att webbhotellet inte skickade mina säkerhetsheaders ändå, åtminstone inte alltid. Det står under
*När A+ blev F*.

## Utgångsläget

Sidan är statisk (Astro), koden ligger i ett publikt GitHub-repo och domänen har DNS och webbhotell hos
samma leverantör. Kraven jag hade:

- push till `main` ska bygga och publicera sidan automatiskt
- mina säkerhetsheaders ska finnas kvar: CSP, HSTS, `nosniff` och så vidare
- deployen ska ha så lite behörighet som möjligt
- den gamla sidan och dess skräpfiler ska försvinna.

Tre alternativ vägdes mot varandra:

- **Cloudflare Pages:** byggde redan sidan, men för att domänen skulle peka dit hade jag behövt byta
  namnservrar till Cloudflare och först stänga av DNSSEC. Annars slutar domänen att fungera för alla
  som validerar DNSSEC.
- **GitHub Pages:** Jekyll behövs inte, eftersom Astro kan byggas i Actions och publiceras direkt. Men GitHub Pages
  kan inte sätta egna HTTP-headers. CSP går att lägga som `<meta>`-tagg, men `frame-ancestors`, `nosniff`,
  `Permissions-Policy` och HSTS går inte att styra. För en sajt som ska visa upp DevSecOps-profilen syns
  det direkt i verktyg som securityheaders.com.
- **Webbhotellet:** Apache läser `.htaccess`, så headers går att sätta själv, och ingen DNS behöver ändras.
  Trodde jag. Mer om det under *När A+ blev F*.

## Så här gjorde jag

### Protokollet: därför blev det FTPS

Först kollade Claude vad servern erbjöd. Port 22 var stängd och port 21 öppen, med Pure-FTPd som
annonserade TLS. Certifikatet på FTP-porten var utfärdat för domänen, så en FTPS-anslutning kan köras med full
certifikatkontroll.

Sedan visade det sig att SSH fanns, fast på en annan port. SSH-nyckel plus `rsync` begränsat med
`rrsync` till bara `public_html` hade varit drömmen. Men **rsync fanns inte installerat på servern**,
och SFTP gick bara att köra med huvudkontot, som når hela webbhotellet.

Då blev FTPS det bästa alternativet:

| | FTPS med eget FTP-konto | SFTP med huvudkontot |
|---|---|---|
| Kryptering | TLS med certifikatkontroll | SSH |
| Inloggning | långt slumpat lösenord, bara i GitHub | nyckel |
| **Vad kontot når** | **bara `public_html`** (servern låser kontot dit) | hela webbhotellskontot |

Ett läckt lösenord som bara kan skriva webbfiler är mindre farligt än en nyckel som når allt.

### Workflowen

Bygget och deployen ligger i samma workflow:

```yaml
deploy:
  needs: build
  if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request' && vars.DEPLOY_METHOD != ''
  environment: production
  concurrency:
    group: deploy-production
    cancel-in-progress: false
```

- Bygget kör `npm ci`, `npm audit` och `astro build` och laddar upp `dist/` som artefakt. Det validerar
  också [topplistan](/lab/topplista-via-pull-requests/) och, i pull requests, commit-meddelandena.
- Deploy-jobbet körs bara från `main`, i GitHub-miljön `production`. Miljön får bara användas från
  `main`, och där ligger uppgifterna som secrets.
- `lftp` speglar `dist/` till servern med `ftp:ssl-force`, `ftp:ssl-protect-data` och
  `ssl:verify-certificate yes`. Lösenordet skickas med `--env-password` i stället för på kommandoraden.
- Synken körs med `--delete`, så filer som inte finns i bygget tas bort. Undantagen är
  `.well-known/acme-challenge/`, som certifikatförnyelsen behöver, och `cgi-bin/`.
- Vid manuell körning är `dry_run` förvalt. Då listas bara vad som skulle laddas upp och raderas.
- Alla actions är fastlåsta på commit-SHA, och workflowen har bara `contents: read`.

Säkerhetsheaders, teckenkodning, 404-sida och omdirigering från www ligger i en `.htaccess` som följer
med i bygget. Efter deployen hämtar CI sidorna och kontrollerar att headers faktiskt kommer med. Det
steget kom till efter att det visade sig att de inte alltid gjorde det (se *När A+ blev F*).

### Förhandsvisningar på Cloudflare Pages

Cloudflare Pages byggde redan sidan, och det var lite kul, så jag behöll det, men med en tydlig roll: **förhandsvisningar**.
Cloudflare bygger varje branch och pull request och lägger en egen URL i PR:en. Då kan jag titta på en ändring
innan den mergas till `main` och går ut i produktion.

Två miljöer betyder två sätt att sätta headers: `.htaccess` för Apache och `_headers` för Cloudflare. Två
filer med samma CSP glider förr eller senare isär, så headers finns nu på **ett** ställe
(`scripts/security-headers.mjs`). Ett litet skript efter bygget skriver dem i rätt format. Cloudflare sätter
miljövariabeln `CF_PAGES` när den bygger, och då blir det `_headers` med `X-Robots-Tag: noindex`, så att
förhandsvisningarna inte indexeras. `.htaccess` tas bort, eftersom Apache-konfigen inte ska gå att hämta där.
Saknas platsen för headers i `.htaccess` stoppas bygget, och deploy-jobbet kontrollerar att CSP:n finns med
innan något laddas upp.

Förhandsvisningarna ska inte gå att förväxla med den riktiga sidan. Cloudflare talar om vilken branch och
commit som byggs, så de får en gul banner med just det, och en länk till produktionen. Och eftersom det här
är min sida finns det förstås ett påskägg åt andra hållet: `git remote -v` i terminalen på den riktiga
sidan avslöjar var förhandsvisningarna finns.

## Det som strulade

- **Punktfiler i artefakten.** `actions/upload-artifact` hoppar som standard över dolda filer. Utan
  `include-hidden-files: true` hade `.htaccess` och `.well-known/security.txt` aldrig nått servern.
  Claude upptäckte det innan första körningen, och deploy-jobbet kontrollerar nu att de finns.
- **"Deploy keys" är fel ställe.** Medan SSH fortfarande var aktuellt försökte jag klistra in den
  privata nyckeln under *Deploy keys* i GitHub, och det fältet ville ha något som började med `ssh-rsa`.
  Deploy keys är för det omvända: att ge en server åtkomst till repot, med en publik nyckel.
  Den privata nyckeln ska ligga som secret.
- **Ett skal trots `command=`.** Jag hade lagt till `command="rrsync …"` på nyckeln i `authorized_keys`,
  men fick ändå ett vanligt skal när jag loggade in. Den begränsningen gällde alltså inte. Det var ytterligare
  ett skäl att lägga SSH åt sidan.
- **Repo-variabel, inte miljövariabel.** Villkoret som avgör om deploy-jobbet ska köras utvärderas
  innan jobbet kopplas till miljön. Där syns bara repo-variabler, så `DEPLOY_METHOD` måste ligga på repot.
- **Första pushen deployade på riktigt.** Planen var en provkörning först. Men push till `main`
  deployar på riktigt, och instruktionen jag fick sa "pusha och kör sedan dry run". Ordningen var fel.
  Det gick bra, men rätt ordning är: lägg in inställningarna, kör manuellt med `dry_run`, pusha sedan.

### När A+ blev F

Efter första deployen gav [securityheaders.com](https://securityheaders.com/) A+. Några dagar senare gav
samma test F, utan att jag ändrat något i mina headers. `.htaccess` var intakt, och Apache skickade
fortfarande alla headers. Det visade sig att det inte var Apache som svarade.

Webbhotellet har nginx framför Apache. När Claude hämtade sidorna med GET (det securityheaders.com gör) kom
startsidan, labbsidan, alla JavaScript-filer och CSS:en direkt från nginx, helt utan säkerhetsheaders. Det
syntes på att ETag-headern hade nginx format och på att headern som Apache-svaren har saknades. Små filer
(under ungefär 1 kB), `.php` och 404-sidan gick fortfarande via Apache och fick alla headers.

Det förklarade också varför allt sett bra ut vid första kontrollen: den gjordes med `curl -I`, och `-I` skickar
**HEAD**, inte GET. HEAD gick till Apache. Kontrollen testade alltså en annan väg genom servern än den som
besökarna tar.

```sh
curl -sI https://christofferlilja.se/              # HEAD: alla headers, via Apache
curl -sD - -o /dev/null https://christofferlilja.se/   # GET: inga headers, direkt från nginx
```

Att slå på HSTS i DirectAdmin hjälpte inte. Sedan kom två svar från webbhotellet som drog åt olika håll.
Chatten sa att nginx beteende inte går att ändra för en enskild kund på ett delat webbhotell, men tipsade om
att mejla teknikerna. Mejlsupporten svarade samma kväll, en torsdag vid niotiden, med två förslag: "Lite
hackigt, men testa byta namn på din html-fil till .php", eller att de lägger in headers i nginx-konfigurationen
för min domän. Det första var precis det vi redan hade kommit fram till. Det andra hade gett headers på alla
filer, men då hade de legat hos webbhotellet, där jag inte kan ändra dem själv, och i ett andra exemplar
bredvid mina egna, som förr eller senare glider isär. Det blev `.php`:

- **Startsidan blev `index.php`.** `.php` skickas alltid vidare till Apache. En PHP-fil utan PHP-kod skickar
  ut HTML:en som den är, så bygget döper om `index.html` till `index.php` innan deployen. Ett test med en
  `headertest/index.php` visade först 403: min egen `.htaccess` hade `DirectoryIndex index.html`, så Apache
  vägrade visa katalogen. Med `index.php` först i listan fungerade det. securityheaders.com betygsätter
  bara sidan man testar, så det räcker för betyget.
- **Påskägget som nästan kördes.** Ett av påskäggen visar en rad från min gamla PHP-sida,
  `<?php echo $myAge; ?>`, och den ligger inbäddad i startsidan. Som `.php` hade den körts på riktigt. Nu
  skrivs `<` som `\u003c` i den inbäddade datan, och bygget stoppas om `<?` ändå skulle finnas kvar.
- **CSP som meta-tagg som reserv.** CSP:n och Referrer-Policy finns också som `<meta>`-taggar i HTML:en, så
  att sidorna som nginx svarar på ändå har en CSP. HSTS, `nosniff` och skydd mot inramning går inte att
  sätta så. Det var ju samma skäl som fick mig att välja bort GitHub Pages.
- **Kontroll med GET.** Ett skript hämtar sidorna och alla skript och stilmallar med GET efter varje deploy,
  och varje måndag, eftersom webbhotellet kan ändra något utan att jag deployar.

Övriga sidor och statiska filer saknar fortfarande headers så länge sidan ligger på webbhotellet. Därför ska
produktionen flytta till Cloudflare Pages, som redan bygger förhandsvisningarna och sätter headers på alla
filer. Det betyder att jag gör det jag valde bort i början: byter namnservrar och hanterar DNSSEC.

### Skyddad main och pull requests

Till en början pushade jag direkt till `main`, och eftersom en push till `main` deployar till produktion
betydde det att varje commit gick rakt ut. Med förhandsvisningar på plats fanns det ingen anledning att
jobba så längre. Nu är `main` skyddad och allt går via pull requests:

1. En branch, till exempel `feature/paskaggsjakt`.
2. En pull request. CI bygger, och Cloudflare lägger en förhandsvisning i PR:en.
3. Merge när förhandsvisningen ser bra ut, och då deployas ändringen till produktion.

Skyddet ligger på två nivåer. På **GitHub** finns en ruleset för `main` som kräver pull request och
godkänt CI-bygge och blockerar force-push och radering. Och eftersom jag jobbar med en AI-agent har även
**Claude Code** en egen spärr: `.claude/settings.json` i repot nekar `git push` till `main` och
force-push, så att agenten inte ens försöker. Instruktionen i `CLAUDE.md` är den tredje nivån, men den är en
uppmaning, inte en spärr. Det är samma resonemang som i jobbet: lita inte på att alla läser dokumentationen.

Senare började jag använda [Conventional Commits](https://www.conventionalcommits.org/sv/v1.0.0/), alltså
commit-meddelanden som `feat(eggs): lägg till git blame` eller `fix(terminal): Esc stänger terminalen`.
Claude föreslog squash-merge, där hela PR:en blir en commit med PR-titeln som meddelande, men jag ville
behålla vanliga merge-commits. Då hamnar varje commit på `main`, så CI kontrollerar varje commit-meddelande i
PR:en. Merge-commits undantas, och Dependabot fick prefixen `build(deps)` och `ci(deps)` för att inte fastna i
kontrollen. De gamla commitarna fick vara som de var. Att skriva om historiken på `main` hade krävt en
force-push förbi mitt eget skydd, och så viktigt var det inte.

## Säkerhetsvinkeln

- **Minsta behörighet slog bekvämlighet.** FTPS med lösenord låter sämre än SSH-nycklar, men ett konto
  som bara når `public_html` begränsar skadan om något läcker.
- **Transporten är krypterad och servern verifieras.** TLS krävs för både inloggning och data, och
  certifikatet kontrolleras, så ingen kan låtsas vara servern.
- **Secrets i en skyddad miljö.** Uppgifterna finns bara i `production`, som bara `main` får använda. Miljön
  kan också kräva att någon godkänner varje deploy (*Required reviewers*). Jag slog på det, med mig själv som
  granskare, men tog bort det igen. Jag förstår fördelen, men för en sajt som bara jag utvecklar blev det ett
  extra steg efter varje merge som jag inte orkade med. Mergen får räcka.
- **Synk med radering städar bort gammal skuld.** Den gamla PHP-sidans rester (testfiler, gamla
  inkluderingsfiler, statistikkatalog) försvann vid första deployen.
- **Främlingar i CI.** Eftersom topplistan fylls på med pull requests från forkar kräver repot godkännande
  innan CI körs för externa bidrag, och CI använder `pull_request`, inte `pull_request_target`, så att de
  aldrig kommer åt secrets. Mer om det i [topplisteanteckningen](/lab/topplista-via-pull-requests/).
- **Verifiera på samma sätt som besökarna.** Efter första deployen kontrollerade Claude med `curl -I` att
  alla headers kom med och att gamla sökvägar gav 404, och körde påskäggen i en headless Edge mot den
  riktiga sajten. Min oro för att nginx framför Apache skulle servera statiska filer utan att läsa
  `.htaccess` verkade obefogad. Men `curl -I` gör HEAD, och HEAD tog en annan väg genom servern än GET.
  Oron var befogad (se *När A+ blev F*). Nu kontrolleras headers med GET, efter varje deploy och varje vecka.
- **Lita inte på en plattform du inte styr.** Säkerheten hängde på en nginx-konfiguration hos webbhotellet
  som jag varken kan se eller ändra, och den ändrades, eller betedde sig annorlunda än jag trodde, utan att
  jag märkte det. En återkommande kontroll fångar det. En plattform där jag själv styr headers löser det.

## Samarbetet med Claude Code

Precis som i förra labben blev rollerna tydliga: jag klickade i DirectAdmin och GitHub, och Claude
felsökte och skrev koden. Claude portskannade servern, läste FTP-bannern utan att logga in,
kontrollerade certifikatet och validerade workflowen med `actionlint` innan något kördes. Nyckeln och
lösenordet behövde Claude aldrig se. De gick direkt från mig till GitHub.

Samtidigt var det Claude som gav instruktionen i fel ordning, så att första pushen deployade utan
provkörning. Och det var jag som märkte att SSH-begränsningen inte gällde.

Det var också Claudes kontroll med `curl -I` som missade nginx-problemet, och jag som upptäckte det när
securityheaders.com gav F. Därifrån gick felsökningen snabbt: Claude hittade skillnaden mellan HEAD och GET,
mönstret med filstorleken och att `.php` alltid gick via Apache. Jag lade upp testfilen i DirectAdmin och
pratade med webbhotellet.

När vi testade och det blev A+, kanske för att vi testade Cloudflare Pages? Så blev det lite tråkigt när
vi var tillbaka på F igen. Kanske inte hela världen men det kändes som det borde vara enkelt för i alla fall
denna sida att nå A+. Begränsningen med webbhotellet är något man får leva med när man delar med andra,
men alternativet att hyra en egen server är inte heller ett alternativ då det skulle bli mycket dyrare.

## Vad jag tar med mig

Det är bra att fundera över säkerheten och göra egna aktiva val istället för att bara köra på standard. Sen
om det inte går att komma hela vägen är det en sak, men då har man i alla fall gjort aktiva egna val och
avvägningar. Som med allt i säkerhet, hur säkert ska det vara och vad är en lagom nivå?

Att inte gå all in på Cloudflage var lite synd att jag inte gjorde, men då hade jag å andra sidan inte
upptäckt den här bristen med headers. Anledningen att jag inte körde Cloudflare Pages var för att jag tolkade
det som att jag skulle slå av DNSSEC helt, men nu verkar det bara temporärt under tiden man flyttar. Sen
vet jag inte så mycket om Cloudflare Pages heller och då är ett gammalt hederligt webbhotell (som jag 
dessutom måste motivera för mig själv varför jag betalar för) det "vettiga" valet.

## Nästa steg

- Flytta produktionen till Cloudflare Pages: namnservrar och DNSSEC, e-posten som ligger kvar hos webbhotellet,
  och bort med `index.php`-lösningen. Det blir en [egen labbanteckning](/lab/flytt-till-cloudflare-pages/).
- Beskriva rulesetet för `main` som kod, till exempel med Terraforms GitHub-provider, i stället för att klicka fram det.
- Kontrollera att PR:er från forks inte byggs automatiskt på Cloudflare, eftersom repot är publikt.
- Peka om liljaonline.se hit.
