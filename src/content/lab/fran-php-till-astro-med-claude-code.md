---
title: 'Från handkodad PHP till Astro, med Claude Code som parprogrammerare'
description: 'Hur jag byggde om min sida från 2008 till en statisk Astro-sida, och vad det innebar att göra det tillsammans med en AI-agent i terminalen.'
date: 2026-09-27
tags: [claude-code, ai, astro, devsecops, påskägg]
draft: true
---

<!--
  UTKAST. Stycken markerade med ✍️ är platser där du behöver fylla i egna tankar.
  Ta bort draft: true när du är nöjd.
  OBS: publicera inte stycket om säkerhetsfynden förrän den gamla sidan är nedtagen
  och MySQL-lösenordet är bytt.
-->

Mellan ungefär 2004 och 2008 byggde jag christofferlilja.se för hand. PHP, XHTML, CSS och
lite Prototype/Scriptaculous, med en egen gästboksklass, ett kontaktformulär med captcha och
en tidsrapportering bakom inloggning. Varenda rad skrev jag själv. Sidan var både mitt
visitkort och min lekplats, där jag kunde testa saker utan att sätta upp en egen server.

> ✍️ **Fyll i:** Vad sidan betydde för dig då, och varför det kändes lite sorgligt eller skönt att ersätta den.

Nu, nästan tjugo år senare, byggde jag om den. Den här gången skrev jag nästan ingen kod själv.
Jag gjorde det tillsammans med [Claude Code](https://claude.com/claude-code), Anthropics
AI-agent som körs i terminalen och kan läsa filer, köra kommandon och skriva kod.

## Utgångsläget

Sidan var hopplöst föråldrad. Den presenterade mig som SharePoint-utvecklare, länkade till
Google+ och hade ett CV från 2012. I praktiken var det LinkedIn som gjorde jobbet, och
liljaonline.se skickade vidare till about.me. Frågan var vad sidan skulle vara till för över huvud taget.

Jag startade Claude Code i *plan mode*, där agenten bara får läsa och fråga, inte ändra något,
och bad den gå igenom sidan och ge förslag. Den läste koden, mitt nya CV och frågade tre saker:
vilken inriktning sidan skulle ha, vad som skulle hända med den gamla sidan och var den skulle hostas.
Vi landade i en **profilsida plus labbanteckningar**, alltså det du läser nu.

## Det första den hittade: säkerhetsbrister

Innan någon ny kod skrevs pekade Claude på att den gamla sidan fortfarande låg live, med
bland annat:

- ett databaslösenord i klartext i en inkluderad PHP-fil
- en publik `phpinfo()`-sida
- ett kontaktformulär som tog avsändaradressen direkt från användaren (header injection)
- en `.htpasswd` i webbroten

Pinsamt för någon som jobbar med DevSecOps, men också en bra påminnelse: gammal kod som
ingen tittar på är fortfarande kod som körs. Den gamla koden ligger nu i ett privat git-repo,
med hemligheterna exkluderade.

> ✍️ **Fyll i:** När och hur du tog ner den gamla sidan och bytte lösenordet.

## Stacken

- **[Astro](https://astro.build)** bygger statisk HTML från mallar och Markdown. Ingen server,
  ingen databas, inget att hacka. Labbanteckningarna är vanliga `.md`-filer.
- **Cloudflare Pages** bygger och publicerar vid varje push till GitHub.
- **GitHub Actions** kör bygge och `npm audit`. Actions är fastlåsta på commit-SHA och
  `permissions` är så snäva som möjligt. Dependabot håller beroendena uppdaterade.
- **Säkerhetsheaders** via `_headers`: CSP utan inline-skript, HSTS och så vidare. Det är därför
  all JavaScript ligger i egna filer.
- **`/.well-known/security.txt`** enligt RFC 9116, där utgångsdatumet räknas fram vid varje bygge.

Jag visste inte vad Astro var när vi började. Claude förklarade, installerade Node.js via winget
(efter att ha frågat) och satte upp projektet.

## Hur samarbetet gick till

Det mesta var ett ping-pong: jag beskrev vad jag ville, Claude byggde, testade och visade
resultatet, och jag testade själv och hittade det som inte stämde. Några exempel:

- **Arkivet som försvann.** Först gjorde vi en statisk kopia av den gamla sidan under `/arkiv/2008/`.
  Den fungerade inte i Astros dev-server utan `index.html` i adressen. Claude fixade det, men
  då hade jag redan bestämt mig: vi skippar arkivet.
- **Profilbilden.** Bilden är stående och beskars från mitten, så mittpunkten hamnade på min hals.
  Claude gjorde en egen kvadratisk beskärning runt ansiktet.
- **å, ä och ö.** `humans.txt` och `security.txt` visades med fel tecken. Filerna var rätt
  sparade, men servern skickade ingen teckenkodning, så webbläsaren gissade på Latin-1.
- **CSS-specificitet.** När vi lade till ett tredje tema slutade sudo-läget (mer om det nedan)
  att färga sidan. Den nya regeln för mörkt tema vann över `.sudo`. Lösningen blev `:where()`.
- **En krasch bara i dev-läget.** Merge-konflikt-påskägget klonar hela sidan, inklusive Astros
  dev-verktygsfält, en webbkomponent som kraschade när den anslöts igen.

Det som imponerade mest var att Claude testade sitt eget arbete: startade en headless Edge,
klickade sig igenom påskäggen med skript och tittade på skärmdumpar. Den hittade flera fel
själv innan jag hann se dem. Till exempel upptäckte den att mitt gamla CV från 2012, som skulle
med i arkivet, innehöll hemadress, födelsedatum och mitt nuvarande mobilnummer. Men den hittade inte allt.
Buggarna ovan hittade jag genom att klicka runt.

> ✍️ **Fyll i:** Hur det kändes att styra i stället för att skriva själv. Gick det snabbare? Tappade du något?

> ✍️ **Fyll i:** Hur du hanterade behörigheterna för agenten, till exempel plan mode, godkännanden eller auto mode, och vad du tycker om det ur ett säkerhetsperspektiv.

## Påskäggen

Eftersom jag är utvecklare, och lite nördig, ville jag ha påskägg. Här blev samarbetet som roligast:
jag kom med idéer, Claude kom med fler och med popkulturreferenser jag inte själv hade kommit på.
Jag avslöjar inte allt, men här är några ledtrådar:

- Tryck `.` på sidan. Kör `help` och sedan `sudo -l`.
- sudo är tidsbegränsat, precis som Entra ID PIM. Stående behörigheter är ju inget att ha.
- Byt tema lite för ofta, och upptäck att även temaknappen har rate limiting (och att WCAG 2.3.1 håller med).
- Öppna sidan i två flikar och byt tema i båda.
- Det finns ett tema från 2008, med besöksräknare och allt.

Ett favoritögonblick: Claude lät först terminalen öppnas med backtick. Jag ifrågasatte det, för
vem använder backtick utanför Markdown? Jag föreslog punkt, som på GitHub. Claude höll med om att
backtick är en död tangent på svenskt tangentbord, och förklarade att traditionen från
Quake-konsolen handlar om *tangenten under Esc*, inte om tecknet. Nu fungerar både `.` och `§`.

> ✍️ **Fyll i:** Ditt favoritpåskägg och varför.

## Vad jag tar med mig

> ✍️ **Fyll i:** Dina egna slutsatser. Några frågor att utgå från: Vad var AI:n bra på, och var behövdes du?
> Skulle du jobba så här i ett kunduppdrag? Vad betyder det för säkerheten i leveranskedjan när
> en agent skriver koden?

## Nästa steg

- Publicera på Cloudflare Pages och peka om DNS.
- Skriva vidare om [homelabbet](/lab/): Proxmox i källaren, som hittills bara kör Pi-hole.
