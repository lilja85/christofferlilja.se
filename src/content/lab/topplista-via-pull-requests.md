---
title: 'En topplista via pull requests i ett publikt repo'
description: 'Hur påskäggsjaktens topplista fylls på med pull requests från främlingar, utan backend, och vad CI kan och inte kan kontrollera.'
date: 2026-09-30
tags: [devsecops, github-actions, säkerhet, påskägg, claude-code]
draft: true
---

<!--
  UTKAST skapat med Claude Code. Fyll i ✍️-rutorna och ta bort draft: true när du är nöjd.
  Säkerhetsgranskat: beskriver bara skydd som är på plats. Svagheten i avsnittet "Säkerhetsvinkeln"
  (valideringen körs med PR:ens egen kod) täcks av att topplist-PR:er granskas och mergas manuellt.
-->

När [påskäggsjakten](/lab/fran-php-till-astro-med-claude-code/) var klar ville jag att de som hittar alla
ägg skulle få synas någonstans. Sidan är statisk och har ingen backend, så topplistan blev en JSON-fil i repot
som fylls på med pull requests. Det betyder att främlingar ska kunna ändra i mitt publika repo, och det är
där det blir intressant.

> ✍️ **Fyll i:** Varför du ville ha en topplista, och varför det fick bli pull requests i stället för något enklare.

## Utgångsläget

- Sidan är statisk (Astro) och GitHub Actions deployar när `main` uppdateras.
- Påskäggen sparas i besökarens `localStorage`. Det finns alltså ingen server som vet vem som hittat vad.
- `main` är skyddad och tar bara emot pull requests som gått igenom CI (se
  [deploy-anteckningen](/lab/deploy-med-github-actions-och-ftps/)).

Målet var en topplista utan backend, databas eller inloggning på sidan, där man inte kan lägga in någon annan
än sig själv.

## Så här gjorde jag

### Från certifikat till pull request

Den som hittat alla ägg får fyrverkerier och ett certifikat. Under *Ta plats på topplistan* skriver man sitt
GitHub-användarnamn och får en färdig rad:

```json
{ "github": "octocat", "completed": 1790801657, "id": "7b4e0855" }
```

`completed` är unix-tiden när man blev klar. Knappen *Öppna filen på GitHub* öppnar `src/data/hall-of-fame.json`
i GitHubs editor. Där klistrar man in raden sist, och GitHub forkar repot och skapar pull requesten åt en.
Commit-meddelandet ska vara `feat(hof): lägg till @octocat`, eftersom repot använder Conventional Commits.
Terminalkommandot `leaderboard` visar listan, men syns först när man hittat sitt första ägg.

För den som inte vill göra en pull request finns *Berätta för mig*, ett färdigt mejl med raden i. Jag lägger
sedan in posten med ett litet skript, `hof-add.mjs`, som räknar ut kontrollsumman.

### Kontrollsumman

`id` är de första åtta hex-tecknen av SHA-256 över användarnamn, tid och en fast fras. Samma beräkning finns i
webbläsaren (Web Crypto) och i Node:

```js
createHash('sha256').update(`${github.toLowerCase()}|${completed}|${HOF_SALT}`).digest('hex').slice(0, 8);
```

Den fångar skrivfel, inte fusk. Koden är publik, så den som vill kan räkna ut ett `id` själv.

### Vad CI kontrollerar

Ett skript, `validate-hall-of-fame.mjs`, körs i CI på varje bygge och kontrollerar hela filen: rätt fält,
giltigt GitHub-namn, en tid efter lanseringen och inte i framtiden, rätt `id` och en plats per konto. I pull
requests kontrolleras dessutom att:

- PR:en bara ändrar `hall-of-fame.json`
- exakt en post läggs till, sist, och att ingen befintlig post ändras
- posten gäller kontot som öppnat PR:en. Man kan bara lägga till sig själv.

Uppgifterna om PR:en når skriptet via miljövariabler:

```yaml
- name: Validera topplistan
  env:
    # Via env, aldrig direkt i run: (skydd mot script injection från PR-data)
    PR_AUTHOR: ${{ github.event.pull_request.user.login }}
    BASE_REF: ${{ github.base_ref }}
    REPO_OWNER: ${{ github.repository_owner }}
  run: node scripts/validate-hall-of-fame.mjs
```

## Det som strulade

- **PR:en som införde topplistan fallerade på sin egen kontroll.** Filen fanns inte på `main` än, och PR:en
  ändrade mycket mer än den filen. Nu gäller PR-kontrollerna bara när filen redan finns på basbranchen, och
  inte för repots ägare. Mina egna PR:er ändrar ju kod.
- **Kontrollsumman byggde först på listan med ägg.** Ett nytt ägg hade då gjort alla befintliga poster
  ogiltiga. Nu bygger den på en fast fras: "Hello, friend.", Elliots hälsning i Mr. Robot.
- **Certifikatet stängdes direkt.** Kördes `achievements --celebrate` med Enter flyttades fokus till *Stäng*
  medan tangenten fortfarande var nedtryckt, så dialogen stängdes innan den syntes. Bara fyrverkerierna blev
  kvar. Lösningen var att flytta fokus först när tangenttrycket är klart.
- **GitHubs förvalda commit-meddelande.** När jag själv provade flödet med min egen rad blev
  commit-meddelandet GitHubs förval, "Add initial hall of fame entry". Sedan dess kräver CI Conventional
  Commits, så certifikatet talar om vad man ska skriva, och felmeddelandet i CI föreslår rätt meddelande
  med ens eget användarnamn.

## Säkerhetsvinkeln

Att ta emot pull requests från främlingar i ett repo som deployar till produktion kräver lite eftertanke:

- **`pull_request`, inte `pull_request_target`.** Med `pull_request` körs PR:er från forkar utan secrets och
  med en token som bara får läsa. `pull_request_target` körs i basrepots sammanhang, med secrets. Kombinerat
  med att koden från PR:en checkas ut är det ett klassiskt sätt att få sina hemligheter stulna.
- **PR-data via `env`.** Användarnamn, branchnamn och titlar styrs av den som skickar in. Läggs de direkt i
  `run:` med `${{ }}` kan de bli shellkod. Via en miljövariabel är de bara text.
- **Godkännande av CI för alla externa bidrag.** GitHubs standardval kräver bara godkännande första gången
  någon bidrar. Men alla på topplistan har fått en PR mergad, och skulle sedan kunna köra valfri kod i CI,
  till exempel en ändrad workflow. Utan secrets, men på min runner-tid. Därför kräver repot godkännande för
  *alla* externa bidrag (Settings → Actions → General).
- **CI är ett stöd, inte ett lås.** Valideringen körs med koden i PR:en. Den som ändrar valideringsskriptet
  kan alltså få den grön, men då ändrar PR:en mer än `hall-of-fame.json`, och det syns direkt i granskningen.
  Därför granskar och mergar jag topplist-PR:er själv. Deployen kan inte triggas från en PR, bara från `main`,
  i en miljö som bara `main` får använda.
- **Ett ärlighetssystem, med verifierad identitet.** Sidan är statisk och koden publik, så det går att fuska
  sig till alla ägg. Den som läser koden för att fuska har å andra sidan lärt sig hur den fungerar. Det som
  faktiskt verifieras är vem som lägger till sig.
- **Minimalt med personuppgifter.** Topplistan innehåller bara ett GitHub-namn, som redan är publikt, och en
  tidpunkt.

## Samarbetet med Claude Code

Claude byggde flödet, valideringsskriptet och CI-stegen, och testade certifikatet och topplistan i en headless
Edge. Jag provade flödet på riktigt, med min egen rad, via GitHubs webbgränssnitt, precis som en besökare
skulle göra. Det var där det förvalda commit-meddelandet dök upp. Claude föreslog också att köra squash-merge,
så att bara PR-titeln skulle behöva kontrolleras. Jag ville behålla vanliga merge-commits, och då blev
kontrollen i stället att varje commit i PR:en ska följa formatet.

> ✍️ **Fyll i:** Hur du tänkte kring att låta främlingar ändra i repot. Kändes det läskigt, eller var det just det som var poängen?

## Vad jag tar med mig

> ✍️ **Fyll i:** Dina slutsatser. Till exempel: är en pull request en bra "databas" för sådant här?
> Vad skulle du göra annorlunda om topplistan fick hundratals poster? Vilken av säkerhetsinställningarna
> hade du missat utan att tänka på det?

## Nästa steg

- Se hur det går när den första främlingen skickar en pull request.
- Köra valideringsskriptet från `main` i stället för från PR:en, så att en PR inte kan ändra sin egen kontroll.
- Beskriva rulesetet och Actions-inställningarna som kod, i stället för att klicka fram dem.
