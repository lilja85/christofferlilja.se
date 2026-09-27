---
title: 'Från handkodad PHP till Astro, med Claude Code som parprogrammerare'
description: 'Hur jag byggde om min sida från 2008 till en statisk Astro-sida, och vad det innebar att göra det tillsammans med en AI-agent i terminalen.'
date: 2026-09-27
tags: [claude-code, ai, astro, devsecops, påskägg]
draft: true
---

<!--
  UTKAST skapat med Claude Code. Fyll i ✍️-rutorna och ta bort draft: true när du är nöjd.
  OBS: kontrollera att resterna av den gamla sidan (test/, protected/, includes/) är borta
  innan du publicerar, eftersom avsnittet "Säkerhetsvinkeln" beskriver den.
-->

Mellan ungefär 2004 och 2008 byggde jag christofferlilja.se för hand. PHP, XHTML, CSS och lite
Prototype/Scriptaculous, med en egen gästboksklass, ett kontaktformulär med captcha och en
tidsrapportering bakom inloggning. Varenda rad skrev jag själv. Nu, nästan tjugo år senare, byggde
jag om den, och den här gången skrev jag nästan ingen kod själv. Jag gjorde det tillsammans med
[Claude Code](https://claude.com/claude-code), Anthropics AI-agent som körs i terminalen och kan
läsa filer, köra kommandon och skriva kod.

> ✍️ **Fyll i:** Vad sidan betydde för dig då, och varför det kändes lite sorgligt eller skönt att ersätta den.

## Utgångsläget

Sidan var hopplöst föråldrad. Den presenterade mig som SharePoint-utvecklare, länkade till
Google+ och hade ett CV från 2012. I praktiken var det LinkedIn som gjorde jobbet, och
liljaonline.se skickade vidare till about.me. Frågan var vad sidan skulle vara till för över huvud taget.

Jag startade Claude Code i *plan mode*, där agenten bara får läsa och fråga, inte ändra något,
och bad den gå igenom sidan och ge förslag. Den läste koden och mitt nya CV och frågade tre saker:
vilken inriktning sidan skulle ha, vad som skulle hända med den gamla sidan och var den skulle hostas.
Vi landade i en **profilsida plus labbanteckningar**, alltså det du läser nu, statiskt byggd och
hostad på Cloudflare Pages.

## Så här gjorde jag

### Stacken

- **[Astro](https://astro.build)** bygger statisk HTML från mallar och Markdown. Ingen server,
  ingen databas, inget att hacka. Labbanteckningarna är vanliga `.md`-filer.
- **GitHub** lagrar koden och **Cloudflare Pages** bygger och publicerar vid varje push.
- **GitHub Actions** kör bygge och `npm audit`. Actions är fastlåsta på commit-SHA och
  `permissions` är så snäva som möjligt. Dependabot håller beroendena uppdaterade.
- **Säkerhetsheaders** via `_headers`: CSP utan inline-skript, HSTS och så vidare. Det är därför
  all JavaScript ligger i egna filer.
- **`/.well-known/security.txt`** enligt RFC 9116, där utgångsdatumet räknas fram vid varje bygge.

Jag visste inte vad Astro var när vi började. Claude förklarade, installerade Node.js via winget
(efter att ha frågat) och satte upp projektet.

### Påskäggen

Eftersom jag är utvecklare, och lite nördig, ville jag ha påskägg. Jag avslöjar inte allt, men här är några ledtrådar:

- Tryck `.` på sidan. Kör `help` och sedan `sudo -l`.
- sudo är tidsbegränsat, precis som Entra ID PIM. Stående behörigheter är ju inget att ha.
- Byt tema lite för ofta, och upptäck att även temaknappen har rate limiting (och att WCAG 2.3.1 håller med).
- Öppna sidan i två flikar och byt tema i båda.
- Det finns ett tema från 2008, med besöksräknare och allt.

> ✍️ **Fyll i:** Ditt favoritpåskägg och varför.

### Ut på nätet

Mycket av publiceringen sker i webbgränssnitt där Claude inte kan klicka, så här blev rollerna
tydliga: jag klickade, Claude felsökte. Repot ligger publikt på GitHub som
`christofferlilja.se`, och Cloudflare Pages bygger sidan vid varje push. Repot har faktiskt
skapats två gånger (se Säkerhetsvinkeln), och Pages-projektet fick kopplas om till det nya.
Kvar är att bestämma hur sidan ska nå domänen (se Nästa steg).

## Det som strulade

- **Arkivet som försvann.** Först gjorde vi en statisk kopia av den gamla sidan under `/arkiv/2008/`.
  Den fungerade inte i Astros dev-server utan `index.html` i adressen. Claude fixade det, men
  då hade jag redan bestämt mig: vi skippar arkivet.
- **Profilbilden.** Bilden är stående och beskars från mitten, så mittpunkten hamnade på min hals.
  Claude gjorde en egen kvadratisk beskärning runt ansiktet.
- **å, ä och ö.** `humans.txt` och `security.txt` visades med fel tecken. Filerna var rätt
  sparade, men servern skickade ingen teckenkodning, så webbläsaren gissade på Latin-1.
- **CSS-specificitet.** När vi lade till ett tredje tema slutade sudo-läget att färga sidan.
  Den nya regeln för mörkt tema vann över `.sudo`. Lösningen blev `:where()`.
- **En krasch bara i dev-läget.** Merge-konflikt-påskägget klonar hela sidan, inklusive Astros
  dev-verktygsfält, en webbkomponent som kraschade när den anslöts igen.
- **Publicering från VS Code.** Första försöket gick inte. Claude läste git-konfigurationen och
  Windows Autentiseringshanteraren (bara läsning) och hittade en remote med fel namn och en gammal
  sparad inloggning från *GitHub for Visual Studio* som fortfarande försökte logga in med lösenord.
  När det väl gick fick repot namnet `site` efter den lokala mappen. Jag döpte om det på
  github.com och pekade om remoten med `git remote set-url`.
- **Cloudflare Pages.** Det nya flödet visade ingen Astro-preset, och jag råkade skapa en Worker
  i stället för ett Pages-projekt. Via det äldre flödet hittade jag rätt. Sedan fallerade bygget med
  `root directory not found`, eftersom jag hade angett `/dist` som *Root directory*. Men `dist`
  finns inte i repot. Den skapas först vid bygget. Rätt är att lämna *Root directory* tomt och ange
  `dist` som *Build output directory*.
- **Force-push räckte inte.** Efter att vi skrivit om git-historiken (se nedan) gick de gamla
  commitarna fortfarande att nå på GitHub via direktlänk till commit-id, och GitHubs publika
  händelselogg visar commit-id:n från tidigare pushar. Lösningen blev att radera repot och skapa
  det på nytt med den tvättade historiken.

## Säkerhetsvinkeln

Innan någon ny kod skrevs pekade Claude på att den gamla sidan fortfarande låg live, med bland annat:

- ett databaslösenord i klartext i en inkluderad PHP-fil
- en publik `phpinfo()`-sida
- ett kontaktformulär som tog avsändaradressen direkt från användaren (header injection)
- en `.htpasswd` i webbroten

Pinsamt för någon som jobbar med DevSecOps, men också en bra påminnelse: gammal kod som ingen
tittar på är fortfarande kod som körs. Lite tur var det också: databasen som lösenordet gick till
fanns inte längre. Den försvann när jag bytte webbhotell 2022, och sidan hade bara följt med.
`phpinfo()`-sidan och kontaktformuläret har jag tagit bort, och den gamla koden ligger nu i ett
lokalt git-repo med hemligheterna exkluderade.

Några saker till som jag tar med mig:

- **`draft: true` döljer bara inlägget på sidan.** I ett publikt repo ligger utkasten fullt läsbara,
  inklusive det här inlägget med beskrivningen av bristerna ovan.
- **Metadata i bilder.** Mitt gamla CV från 2012, som skulle med i arkivet, innehöll hemadress,
  födelsedatum och mitt nuvarande mobilnummer. Och originalet till profilbilden innehöll
  fotografens namn, kontaktuppgifter och arbetsgivare i EXIF-datan. Den bilden låg i
  repot en stund innan vi upptäckte det. Den byggda sidan var ren, eftersom bildbehandlingen tar bort
  metadata, men källfilen gjorde det inte. Claude sökte igenom hela git-historiken, både diffar
  och metadata i alla bilder som någonsin legat i repot. Sedan skrevs historiken om med
  `git filter-branch`, efter en säkerhetskopia som `git bundle`, och till sist fick repot skapas på nytt
  (se Det som strulade).
- **DNSSEC och namnservrar.** Ska man flytta DNS till Cloudflare måste DNSSEC stängas av först.
  Annars stämmer inte signaturerna efter bytet, och domänen slutar fungera för alla som
  validerar DNSSEC, vilket många svenska internetleverantörer gör.

## Samarbetet med Claude Code

Det mesta var ett ping-pong: jag beskrev vad jag ville, Claude byggde, testade och visade
resultatet, och jag testade själv och hittade det som inte stämde. Claude testade sitt eget arbete
genom att starta en headless Edge, klicka sig igenom påskäggen med skript och titta på
skärmdumpar. Den hittade flera fel själv, till exempel personuppgifterna i det gamla CV:t. Men
nästan alla buggar i listan ovan hittade jag genom att klicka runt.

Påskäggen var där samarbetet blev som roligast: jag kom med idéer, Claude kom med fler och med
popkulturreferenser jag inte själv hade kommit på. Ett favoritögonblick: Claude lät först
terminalen öppnas med backtick. Jag ifrågasatte det, för vem använder backtick utanför Markdown?
Jag föreslog punkt, som på GitHub. Claude höll med om att backtick är en död tangent på svenskt
tangentbord, och förklarade att traditionen från Quake-konsolen handlar om *tangenten under Esc*,
inte om tecknet. Nu fungerar både `.` och `§`.

> ✍️ **Fyll i:** Hur det kändes att styra i stället för att skriva själv. Gick det snabbare? Tappade du något?

> ✍️ **Fyll i:** Hur du hanterade behörigheterna för agenten, till exempel plan mode, godkännanden eller auto mode, och vad du tycker om det ur ett säkerhetsperspektiv.

## Vad jag tar med mig

> ✍️ **Fyll i:** Dina egna slutsatser. Några frågor att utgå från: Vad var AI:n bra på, och var behövdes du?
> Skulle du jobba så här i ett kunduppdrag? Vad betyder det för säkerheten i leveranskedjan när
> en agent skriver koden?

## Nästa steg

<!-- Status 2026-09-28, för att kunna återuppta: sidan byggs av Cloudflare Pages från det nya repot
     men nås bara via *.pages.dev. Domänen pekar fortfarande på den gamla sidan hos Inleed. -->

- **Bestämma hur sidan når domänen**, antingen:
  - **Cloudflare Pages** (redan kopplat): stänga av DNSSEC, byta namnservrar till Cloudflare, lägga
    till domänen under Custom domains och slå på DNSSEC igen hos Cloudflare. Själva domänen behöver inte
    flyttas, och .se stöds ändå inte av Cloudflare Registrar. Ingen e-post används på domänen.
  - **GitHub Actions till webbhotellet** (lutar åt det, och det är en bra labb i sig): bygga och sedan
    deploya `dist/` till `public_html` med rsync över SSH, om paketet har SSH, annars FTPS. Använd ett separat
    konto som bara når `public_html`, secrets i en GitHub Environment `production` som bara får användas från `main`,
    actions fastlåsta på SHA och en dry-run första gången. Synken tar bort gamla filer, men ska
    undanta `.well-known/acme-challenge/` och `awstats`. `_headers` fungerar bara på Cloudflare och
    måste bli en `.htaccess` (säkerhetsheaders, `charset=utf-8` för textfiler, `ErrorDocument 404`).
    Ta bort Pages-projektet om det blir den här vägen.
- **Städa resterna av den gamla sidan:** `test/`, `protected/` och `includes/` ligger fortfarande kvar.
  En deploy med synk och radering tar hand om det automatiskt.
- **Uppdatera dokumentationen** när hostingen är bestämd: `CLAUDE.md`, README och det här inlägget.
- **Peka om liljaonline.se** hit i stället för till about.me.
- **Fylla i ✍️-rutorna** och publicera.
- **Skriva vidare om [homelabbet](/lab/):** Proxmox i källaren, som hittills bara kör Pi-hole.
