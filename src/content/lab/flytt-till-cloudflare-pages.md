---
title: 'Från webbhotell till Cloudflare Pages, för headerns skull'
description: 'Varför min statiska sida flyttade från ett vanligt webbhotell till Cloudflare Pages, hur namnservrar, DNSSEC och e-post följde med, och vad som kunde städas bort efteråt.'
date: 2026-10-01
tags: [devsecops, cloudflare, dns, deploy, claude-code]
draft: true
---

<!--
  UTKAST skapat med Claude Code INNAN flytten. Bakgrunden och planen stämmer; allt om hur det gick
  är ✍️-rutor. Uppdatera efter flytten (checklistan finns i docs/flytt-till-cloudflare.md) och ta bort
  draft: true när du är nöjd.
  Säkerhetsgranskat: inga IP-adresser, DNS-poster utöver det som är publikt, tokens eller kontonamn.
  Skriv inte in API-tokens, DS-poster eller DKIM-nycklar i texten när du fyller i.
-->

För några dagar sedan valde jag bort Cloudflare Pages för produktionen och la sidan på mitt vanliga
webbhotell, för att kunna sätta säkerhetsheaders själv. Det visade sig att webbhotellet inte skickade dem
ändå, åtminstone inte för de flesta filerna. Så nu flyttar sidan till Cloudflare Pages, som redan byggde alla
förhandsvisningar. Ett steg tillbaka till alternativet jag valde bort, men av bättre skäl.

## Utgångsläget

I [deploy-anteckningen](/lab/deploy-med-github-actions-och-ftps/) står hela historien. Kortfattat:

- GitHub Actions bygger sidan och deployar den till webbhotellet med FTPS. Säkerhetsheaders sätts i `.htaccess`.
- Webbhotellet har nginx framför Apache. nginx svarar själv på större statiska filer, och då läses aldrig
  `.htaccess`. securityheaders.com gick från A+ till F.
- Webbhotellet kan inte ändra nginx beteende för en enskild kund. Mejlsupporten erbjöd att lägga in headers
  i serverkonfigurationen åt mig, men då hade jag inte kunnat ändra dem själv.
- Startsidan går nu via Apache som `index.php`, så att den får sina headers. Övriga sidor, skript och bilder
  saknar dem fortfarande. Det är en brygga, inte en lösning.

Cloudflare Pages sätter headers på alla filer från en `_headers`-fil, som bygget redan skriver för
förhandsvisningarna. Det som höll mig borta var DNS: för att domänen ska peka på Cloudflare måste
namnservrarna flytta dit, och DNSSEC måste stängas av under bytet.

Det som **inte** flyttar: domänregistreringen, e-posten för domänen och min andra sajt, som ligger kvar
på webbhotellet.

> ✍️ **Fyll i:** Hur det kändes att gå tillbaka till alternativet du valde bort, och om det var ett svårt beslut.

## Så här gjorde jag

### DNS, DNSSEC och e-posten

Ordningen spelar roll, annars slutar domänen fungera för alla som validerar DNSSEC, eller så slutar mejlen
komma fram:

1. Exportera hela DNS-zonen från webbhotellet, inte bara det som syns utifrån. DKIM- och DMARC-poster syns
   inte med en vanlig uppslagning.
2. Stäng av DNSSEC (ta bort DS-posten hos registraren) och vänta ut TTL:en.
3. Lägg in zonen i Cloudflare. Posterna för e-posten ska peka på webbhotellet som förut och **inte** gå via
   Cloudflares proxy (grått moln).
4. Byt namnservrar hos registraren.
5. Slå på DNSSEC i Cloudflare och lägg in den nya DS-posten hos registraren.

> ✍️ **Fyll i:** Hur lång tid tog varje steg, och fungerade e-posten hela tiden?

### Cloudflare Pages som produktion

- `main` blir produktion, med domänen och en omdirigering från www.
- Bygget skriver redan `_headers` från samma lista som `.htaccess`. Skillnaden blir att produktionen inte ska
  ha `X-Robots-Tag: noindex` och den gula förhandsvisningsbannern, men förhandsvisningarna ska ha kvar dem.
- PR:er från forkar ska inte byggas automatiskt, eftersom repot tar emot pull requests till topplistan.

> ✍️ **Fyll i:** Hur du löste godkännandet före produktion (se Säkerhetsvinkeln), och hur det fungerade i praktiken.

### Det som kunde tas bort

Det bästa med flytten är allt som inte behövs längre:

- `index.php`-tricket för startsidan, och kontrollen som stoppar bygget om sidan innehåller `<?`.
- CSP:n och Referrer-Policy som meta-taggar, som bara fanns som reserv för sidorna utan headers.
- `.htaccess`-delarna för webbhotellet, och varningarna i headerkontrollen. Nu kräver den headers överallt.
- FTP-kontot på webbhotellet och uppgifterna i GitHub.

> ✍️ **Fyll i:** Något mer som visade sig onödigt, eller något du saknar från webbhotellet?

## Det som strulade

> ✍️ **Fyll i:** Vad som gick fel under flytten, felmeddelandet och hur det löstes.

## Säkerhetsvinkeln

- **Headers på allt, från ett ställe.** Alla säkerhetsheaders kommer från en lista i repot och hamnar i
  `_headers`. Inget i Cloudflares inställningar, så att de inte finns på två ställen som glider isär.
- **Godkännande före produktion.** På webbhotellet väntar varje deploy på mitt godkännande (*Required
  reviewers* i GitHub). Cloudflares vanliga Git-koppling deployar `main` direkt vid merge, och då försvinner
  den spärren. Alternativet är att deploya produktionen från GitHub Actions med en API-token som bara får
  ändra just det här Pages-projektet, i samma miljö med godkännande som förut.
- **DNSSEC under bytet.** Stängs inte DNSSEC av före bytet av namnservrar matchar signaturerna inte längre,
  och domänen slutar fungera för alla som validerar, vilket många svenska internetleverantörer gör.
- **E-posten utanför proxyn.** Mejlservern ska inte gå via Cloudflare, och SPF-posten ska fortfarande
  godkänna rätt server när domänens adress pekar någon annanstans.
- **Minsta behörighet, igen.** Ett FTP-konto och ett lösenord i GitHub som inte längre finns kan inte läcka.
  En API-token ska bara kunna göra en sak.
- **Kontroll med GET, efter varje deploy och varje vecka.** Det var den kontrollen som saknades när A+ blev F.

> ✍️ **Fyll i:** Hur du tänker kring att lägga DNS och hela sajten hos en stor leverantör som Cloudflare, jämfört med ett litet webbhotell.

## Samarbetet med Claude Code

Claude hittade orsaken till F-betyget, att HEAD och GET tog olika vägar genom servern, och skrev en
checklista för flytten innan något ändrades: DNS, DNSSEC, e-posten och varje del av koden som var byggd
för webbhotellet. Den skrevs medan `index.php`-tricket fortfarande var färskt, så att inget skulle bli kvar.

> ✍️ **Fyll i:** Vem som gjorde vad under själva flytten. Vad kunde Claude hjälpa till med när det mesta skedde i webbgränssnitt hos registraren och Cloudflare?

## Vad jag tar med mig

> ✍️ **Fyll i:** Dina slutsatser. Till exempel: var det fel att välja bort Cloudflare från början, eller var det
> rätt beslut med det du visste då? Vad säger det om att verifiera säkerhet på samma sätt som användarna möter den?

## Nästa steg

- Överväg HSTS preload när allt har fungerat ett tag.
- Beskriva Cloudflare-inställningarna och rulesetet för `main` som kod, till exempel med Terraform.
