---
title: 'Från handkodad PHP till Astro, med Claude Code som parprogrammerare'
description: 'Hur jag byggde om min sida från 2008 till en statisk Astro-sida, och vad det innebar att göra det tillsammans med en AI-agent i terminalen.'
date: 2026-09-27
tags: [claude-code, ai, astro, devsecops, påskägg]
draft: false
---

<!--
  UTKAST skapat med Claude Code. Fyll i ✍️-rutorna och ta bort draft: true när du är nöjd.
  OBS: kontrollera att resterna av den gamla sidan (test/, protected/, includes/) är borta
  innan du publicerar, eftersom avsnittet "Säkerhetsvinkeln" beskriver den.
-->

Mellan ungefär 2004 och 2008 byggde jag christofferlilja.se för hand. PHP, XHTML, CSS och lite
Prototype/Scriptaculous, med en egen gästboksklass, ett kontaktformulär med captcha och en
tidsrapportering bakom inloggning. Varenda rad skrev jag själv dels med tanke på att visa att
jag faktiskt kan, men mest för att jag tyckte det var kul att få testa koda hemsidor. Nu, nästan
tjugo år senare, byggde jag om den, och den här gången skrev jag nästan ingen kod själv. Jag gjorde
det tillsammans med [Claude Code](https://claude.com/claude-code), Anthropics AI-agent som körs i
terminalen och kan läsa filer, köra kommandon och skriva kod.

Att jag nu inte skrivit koden själv känns både lite vemodigt och lite skrämmande. Kan jag stå bakom koden
på sidan och kan man anse att jag har relevanta kunskaper? Jag tycker väldigt mycket om att koda, men
jag hade också gärna sluppit all boilerplate-kod man måste skriva. Samtidigt brukar man säga att AI
bara förstärker det man själv kan. Låter man den koda på utan riktlinjer blir det ett resultat, men
är det vad du ville? Jag håller nog med och resultatet av denna sida speglar verkligen vem jag är :)

Det är oavsett väldigt skönt att bli av med den gamla sidan och mitt dålig samvete eftersom den inte har
fått knappt någon kärlek sedan 2012. Jag behövde antingen lägga ner sidan eller göra vad jag gjorde nu.

## Utgångsläget

Sidan var hopplöst föråldrad. Den presenterade mig som SharePoint-utvecklare, länkade till
Google+ (stängdes april 2019) och hade ett CV från 2012. I praktiken är det LinkedIn som gör jobbet, och
[liljaonline.se](https://liljaonline.se) skickade vidare till [about.me](https://about.me/christofferlilja).
Frågan var vad sidan skulle vara till för över huvud taget.

Jag startade Claude Code i *plan mode*, där agenten bara får läsa och fråga, inte ändra något,
och bad den gå igenom sidan och ge förslag. Den läste koden och mitt nya CV och frågade tre saker:
vilken inriktning sidan skulle ha, vad som skulle hända med den gamla sidan och var den skulle hostas.
Vi landade i en **profilsida plus labbanteckningar**, alltså det du läser nu, statiskt byggd.
Var den skulle ligga ändrades längs vägen (se Ut på nätet).

## Så här gjorde jag

### Stacken

- **[Astro](https://astro.build)** bygger statisk HTML från mallar och Markdown. Ingen server,
  ingen databas, inget att hacka. Labbanteckningarna är vanliga `.md`-filer.
- **GitHub** lagrar koden. **GitHub Actions** bygger, kör `npm audit` och deployar till mitt vanliga
  webbhotell när en pull request mergas till `main`. Actions är fastlåsta på commit-SHA och
  `permissions` är så snäva som möjligt. Dependabot håller beroendena uppdaterade.
- **Säkerhetsheaders** via `.htaccess`: CSP utan inline-skript, HSTS och så vidare. Det är därför
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
- Det finns 20 påskägg totalt. Kör `achievements` i terminalen för att se hur många du hittat. Den som hittar
  alla blir firad med fyrverkerier, som när Outlook firar ett "Congratulations", och får ett certifikat.
- Med certifikatet kan du ta plats på en topplista, via en pull request till repot. Hur det hänger ihop, och
  varför det krävde lite säkerhetstänk, har jag skrivit om i
  [En topplista via pull requests i ett publikt repo](/lab/topplista-via-pull-requests/).
- Och den som tröttnar kan köra `ragequit` och börja om från noll.

Mitt absoluta favoripåskägg är när man ska försöka aktivera sig för sudo igen efter att ha blivit utelåst
och chefen i sista steget bara "godkänner, som vanligt". Då skrattade jag högt, eftersom det är något jag
jobbar med dagligen och försöker mota.

### Ut på nätet

Mycket av publiceringen sker i webbgränssnitt där Claude inte kan klicka, så här blev rollerna
tydliga: jag klickade, Claude felsökte. Repot ligger publikt på GitHub som
`christofferlilja.se`. Repot har faktiskt skapats två gånger (se Säkerhetsvinkeln).

Först byggde Cloudflare Pages sidan, men för att få domänen dit hade jag behövt flytta DNS
till Cloudflare. Jag funderade också på GitHub Pages, men där går det inte att sätta egna
HTTP-headers. CSP kan läggas som `<meta>`-tagg, men till exempel `frame-ancestors`, `nosniff` och
HSTS går inte att styra. Det slutade med att **GitHub Actions bygger sidan och deployar den till
mitt vanliga webbhotell** med FTPS. Headers sätts i en `.htaccess`, och ingen DNS behöver ändras.
Det blev dessutom en bra labb i säker deploy, som jag skrivit om i
[Deploy med GitHub Actions och FTPS till ett vanligt webbhotell](/lab/deploy-med-github-actions-och-ftps/).

### Går att forka

När sidan väl fanns ville jag att den skulle gå att återanvända. Allt personligt ligger nu i en enda fil,
`site.config.mjs`: namn, texter, länkar, domän, repo och påskäggens texter, som operativsystemet
`ChristofferOS` och BIOS-tillverkaren `Lilja Megatrends Inc.`. Astro-sidorna läser filen direkt. Påskäggen i
webbläsaren får en publik del av den inbäddad som JSON i sidan, eftersom CSP:n inte tillåter inline-skript.
Påskäggen, 2008-temat, topplistan och labbet går att slå av var för sig, och antalet ägg räknas om efter det.

För att se att inget personligt läckte byggde Claude sidan åt en påhittad person, Ada Lovelace på
`ada.example`, och sökte igenom hela bygget efter mitt namn, min domän och min e-post. Inga träffar. Hur man
gör den till sin egen står i README:n i repot.

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

- ett databaslösenord i klartext i en inkluderad PHP-fil, men databasen var borta sen länge.
- en publik `phpinfo()`-sida, eftersom jag förr i tiden använde den för att se mina php-inställningar och såg inte problemet då
- ett kontaktformulär som tog avsändaradressen direkt från användaren (header injection), men formuläret fungerade inte ändå eftersom captchan inte längre fungerade
- en `.htpasswd` i webbroten, men den var bara för att testa just lsöenskydda mappar

Skulle kunnat vara pinsamt för någon som jobbar med DevSecOps, men också en bra påminnelse: gammal kod som ingen
tittar på är fortfarande kod som körs. `phpinfo()`-sidan och kontaktformuläret har jag tagit bort, och den gamla koden ligger nu i ett lokalt git-repo med hemligheterna exkluderade. Databaslösenordet behöver inte 
roteras, eftersom databasen inte finns längre.

Några saker till som jag tar med mig:

- **`draft: true` döljer bara inlägget på sidan.** I ett publikt repo ligger utkasten fullt läsbara,
  inklusive det här inlägget med beskrivningen av bristerna ovan.
- **Metadata i bilder.** Mitt gamla CV från 2012, som skulle med i arkivet, innehöll hemadress,
  födelsedatum och mitt nuvarande mobilnummer. Och originalet till profilbilden innehöll
  fotografens namn, kontaktuppgifter och arbetsgivare i EXIF-datan. Den bilden låg i
  repot en stund innan vi upptäckte det. Samma sak med CV:t på sidan: det är en webbversion utan
  telefonnummer, eftersom allt i `public/` publiceras och ligger kvar i git-historiken. Den byggda sidan var ren, eftersom bildbehandlingen tar bort
  metadata, men källfilen gjorde det inte. Claude sökte igenom hela git-historiken, både diffar
  och metadata i alla bilder som någonsin legat i repot. Sedan skrevs historiken om med
  `git filter-branch`, efter en säkerhetskopia som `git bundle`, och till sist fick repot skapas på nytt
  (se Det som strulade).
- **DNSSEC och namnservrar.** Hade jag flyttat DNS till Cloudflare hade DNSSEC behövt stängas av först.
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

Att styra istället för att skriva själv är oändligt mycket snabbare. Men helt ärligt har jag inte helt koll på
koden som genereras. Ju viktigare kod desto mer antar jag att den behöver granskas. Denna sida är inte alls
viktig så jag har inte kontrollerat alls mycket utan snarare agerat krav och testare.

## Vad jag tar med mig

Något jag tar med mig och som jag testade var att sätta tillbaka agenten flera gånger till plan-mode. Den
frågade rätt mycket även i auto men väljer jag plan mode med flit är jag säker på att lite större och kanske
osäkrare förändring gås igenom lite extra först och kan desstom gå fram och tillbaka några gånger innan
några förändringar görs.

AI:n var väldigt bra på att testa sina egna förändringar och fick stoppa och göra om flera gånger för egna fel
som den introducerade. Väldigt skönt att slippa mcyket av den ping-pongen, även om det blev en del ändå.

Där jag framförallt behövdes var att tydligt styra vart jag ville. Att bara göra en sida klarar den galant,
men är det du som valt sidan eller AI som tagit fram något generiskt som ser bra ut utan så mycket eftertanke?
Och förutom sidan tyckte jag det var kul att fokusera på själva leveranssteget med kontroller i de actions som
körs och liknande.

Det var också kul att testa GitHub issues. Jag har kört det tidigare men inte använt som mina interna
anteckningar för vad jag ville göra. Kollar man dem kan man också delvis förstå hur tankarna gick under tiden
sidan togs fram och vilka problem jag ville lösa.

## Nästa steg

<!-- Status 2026-09-30: sidan är live på christofferlilja.se och deployas av GitHub Actions med FTPS.
     Alla labbanteckningar är utkast, så Lab-länken i menyn är dold tills en publiceras. -->

- **Peka om liljaonline.se** hit i stället för till about.me?