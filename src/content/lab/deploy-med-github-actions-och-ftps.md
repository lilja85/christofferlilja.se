---
title: 'Deploy med GitHub Actions och FTPS till ett vanligt webbhotell'
description: 'Hur min statiska Astro-sida byggs i GitHub Actions och synkas till webbhotellet med minsta möjliga behörighet, och varför det inte blev Cloudflare, GitHub Pages eller SSH.'
date: 2026-09-28
tags: [devsecops, github-actions, deploy, claude-code, säkerhet]
draft: true
---

<!--
  UTKAST skapat med Claude Code. Fyll i ✍️-rutorna och ta bort draft: true när du är nöjd.
  Säkerhetsgranskat: inga användarnamn, lösenord, nycklar eller interna sökvägar utöver standardkataloger.
-->

När jag [byggde om den här sidan](/lab/fran-php-till-astro-med-claude-code/) återstod en sak: att få ut
den på min domän. Det slutade med att GitHub Actions bygger sidan och synkar den till mitt vanliga
webbhotell över FTPS. Det låter kanske lite 2008, men det visade sig vara det alternativ som gav **minst
behörighet**. Precis som förra gången gjorde jag det tillsammans med Claude Code.

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

- Bygget kör `npm ci`, `npm audit` och `astro build` och laddar upp `dist/` som artefakt.
- Deploy-jobbet körs bara från `main`, i GitHub-miljön `production`. Miljön får bara användas från
  `main`, och där ligger uppgifterna som secrets.
- `lftp` speglar `dist/` till servern med `ftp:ssl-force`, `ftp:ssl-protect-data` och
  `ssl:verify-certificate yes`. Lösenordet skickas med `--env-password` i stället för på kommandoraden.
- Synken körs med `--delete`, så filer som inte finns i bygget tas bort. Undantagen är
  `.well-known/acme-challenge/`, som certifikatförnyelsen behöver, och `cgi-bin/`.
- Vid manuell körning är `dry_run` förvalt. Då listas bara vad som skulle laddas upp och raderas.
- Alla actions är fastlåsta på commit-SHA, och workflowen har bara `contents: read`.

Säkerhetsheaders, teckenkodning, 404-sida och omdirigering från www ligger i en `.htaccess` som följer
med i bygget.

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

## Säkerhetsvinkeln

- **Minsta behörighet slog bekvämlighet.** FTPS med lösenord låter sämre än SSH-nycklar, men ett konto
  som bara når `public_html` begränsar skadan om något läcker.
- **Transporten är krypterad och servern verifieras.** TLS krävs för både inloggning och data, och
  certifikatet kontrolleras, så ingen kan låtsas vara servern.
- **Secrets i en skyddad miljö.** Uppgifterna finns bara i `production`, som bara `main` får använda. Man kan
  också kräva manuellt godkännande före varje deploy.
- **Synk med radering städar bort gammal skuld.** Den gamla PHP-sidans rester (testfiler, gamla
  inkluderingsfiler, statistikkatalog) försvann vid första deployen.
- **Verifiera efteråt.** Claude kontrollerade med `curl -I` att alla headers kommer med, även på
  statiska filer, och att gamla sökvägar ger 404. Den körde också påskäggen i en headless Edge mot den
  riktiga sajten för att se att CSP:n inte stoppade något. Min oro för att nginx framför Apache skulle
  servera statiska filer utan att läsa `.htaccess` besannades inte.

> ✍️ **Fyll i:** Slog du på "Required reviewers" på miljön, och varför eller varför inte?

## Samarbetet med Claude Code

Precis som i förra labben blev rollerna tydliga: jag klickade i DirectAdmin och GitHub, och Claude
felsökte och skrev koden. Claude portskannade servern, läste FTP-bannern utan att logga in,
kontrollerade certifikatet och validerade workflowen med `actionlint` innan något kördes. Nyckeln och
lösenordet behövde Claude aldrig se. De gick direkt från mig till GitHub.

Samtidigt var det Claude som gav instruktionen i fel ordning, så att första pushen deployade utan
provkörning. Och det var jag som märkte att SSH-begränsningen inte gällde.

> ✍️ **Fyll i:** Hur det kändes att ge en AI-agent i uppdrag att bygga något som får skriva till din produktionsmiljö.

## Vad jag tar med mig

> ✍️ **Fyll i:** Dina slutsatser. Till exempel: är "minsta behörighet" viktigare än "modernaste tekniken"?
> Skulle du göra samma val i ett kunduppdrag? Vad hade du gjort om webbhotellet haft rsync?

## Nästa steg

- Slå på *Required reviewers* på miljön `production` om det inte redan är gjort.
- Om webbhotellet någon gång får rsync, eller SSH-konton som bara når en katalog: byta till SSH med en nyckel
  som bara får köra `rrsync`.
- Kontrollera att PR:er från forks inte byggs automatiskt på Cloudflare, eftersom repot är publikt.
- Peka om liljaonline.se hit.
