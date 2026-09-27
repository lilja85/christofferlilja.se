---
name: labbanteckning
description: Skapa en labbanteckning (ett kort tekniskt blogginlägg i Markdown) om det som gjorts i den aktuella sessionen, med en fast struktur som går att flytta rakt in i Christoffers sajt christofferlilja.se. Använd den här skillen när användaren säger "labbanteckning", "skriv en labbanteckning", "skriv ihop det här till labbet", "blogga om det vi gjort", "dokumentera det här som en labbanteckning" eller liknande, oavsett vilket projekt sessionen gäller (homelab, Proxmox, nätverk, DevSecOps, IaC, AI/Claude Code, sidoprojekt).
---

# Labbanteckning

Christoffer (DevSecOps-konsult och lösningsarkitekt i Jönköping) samlar korta anteckningar om
tekniska experiment under `/lab` på christofferlilja.se. Skillen gör om arbetet i den aktuella
sessionen till en sådan anteckning, **i det projekt han jobbar i just nu**. Han flyttar sedan
filen själv till sajtens `src/content/lab/`. Därför ska varje anteckning ha samma format och
struktur, oavsett vilken session den skapas i.

## Var filen hamnar

Spara som `labbanteckningar/<slug>.md` i roten av den aktuella arbetskatalogen, och skapa mappen om
den saknas. Filnamnet är sluggen, alltså den blivande adressen `/lab/<slug>/`, så att filen kan flyttas utan
att döpas om.

- **Slug:** kort, gemener, bindestreck, å/ä/ö utbytta mot a/o (`homelab-del-2-tailscale`). Är det
  en fortsättning på en serie, till exempel "Homelab del N", fortsätter du numreringen. Fråga om du är osäker.
- **Undantag:** om arbetskatalogen *är* sajtens repo (det finns en `src/content/lab/`) sparar du
  direkt där i stället.
- Rör inte projektets git: committa inte, och lägg inte till något i `.gitignore`.
- **Bilder** (sällan): lägg dem bredvid som `<slug>-1.png` och länka med `![Alt-text](./<slug>-1.png)`,
  så att de kan flyttas tillsammans med anteckningen.

## Samla underlag

Det viktigaste underlaget är **den här sessionen**: vad Christoffer ville, vad som gjordes, vad
som gick fel och hur det löstes, vilka beslut som togs och varför. Komplettera med `git log` och diffar i
arbetskatalogen, och med kommandon och felmeddelanden som faktiskt förekom. De gör texten konkret.

Skriv bara sådant som faktiskt hände eller som framgår av källorna. Det du inte vet, som känslor, beslut
utanför sessionen eller hur något slutade, blir en ✍️-ruta. Hellre en ruta för mycket än ett påhittat
påstående i hans namn.

## Mall

Använd exakt den här strukturen. Rubrikerna är fasta för att anteckningarna ska kännas som en serie.
Har ett avsnitt inget innehåll från sessionen, ersätt brödtexten med en ✍️-ruta i stället för att ta
bort rubriken. Enda undantaget är "Samarbetet med Claude Code", som utgår om sessionen inte gjordes med
Claude Code.

````markdown
---
title: 'Kort, konkret rubrik'
description: 'En mening om vad inlägget handlar om (visas i listan och i förhandsvisningar).'
date: ÅÅÅÅ-MM-DD
tags: [tagg1, tagg2]
draft: true
---

<!--
  UTKAST skapat med Claude Code. Fyll i ✍️-rutorna och ta bort draft: true när du är nöjd.
  Flytta filen till src/content/lab/ i sajtens repo.
  <Eventuella saker att tänka på före publicering, från säkerhetsgranskningen.>
-->

<Inledning utan rubrik: 2–4 meningar om vad jag gjorde och varför.>

## Utgångsläget

<Hur det såg ut innan, och vilket problem eller mål jag hade.>

## Så här gjorde jag

<Stegen i ordning, med kodblock för kommandon och konfiguration. Konkret nog att följa.>

## Det som strulade

<Vad som gick fel, felmeddelandet och hur det löstes. Ofta det mest värdefulla för läsaren.>

## Säkerhetsvinkeln

<Least privilege, hemligheter, härdning, exponering, leveranskedja: vad jag tänkte på eller borde tänka på.>

## Samarbetet med Claude Code

<Vem som gjorde vad: var agenten var bra och var jag behövdes.>

## Vad jag tar med mig

> ✍️ **Fyll i:** <Konkreta frågor som hjälper mig att formulera slutsatserna.>

## Nästa steg

- <Konkreta nästa steg, med länkar till relaterade labbanteckningar som `/lab/<slug>/` om de finns.>
````

### Frontmatter

Frontmattern måste följa sajtens schema, annars fallerar bygget när filen flyttas:

- `title`, `description`: strängar inom enkla citattecken. Dubbla en apostrof inuti (`''`).
- `date`: dagens datum, `ÅÅÅÅ-MM-DD`.
- `tags`: 2–5 korta taggar med gemener, till exempel `homelab`, `proxmox`, `dns`, `devsecops`,
  `claude-code`, `iac`, `säkerhet`. Återanvänd hellre en befintlig tagg än att hitta på en ny variant.
- `draft: true`: alltid, eftersom Christoffer publicerar själv.

### Språk och ton

Svenska, i jag-form som Christoffer. Rakt, konkret och lite personligt, med glimten i ögat men utan
överdrifter. Han är utvecklare och säkerhetsnörd och skriver för andra tekniker. Förklara kort
förkortningar som en utvecklare utanför området kanske inte kan. Undvik säljspråk och utfyllnad.
En labbanteckning är hellre kort och konkret än lång. Sikta på något som läses på 3–6 minuter.

### Samarbetet med Claude Code

Att han jobbar tillsammans med Claude Code är en del av vad han vill visa, så var ärlig och konkret.
Skriv "Claude" eller "Claude Code" i tredje person. Ge exempel på vad agenten bidrog med, som
felsökning, att den testade själv eller hittade något han missat, och på var Christoffer behövdes, som
att hitta buggar, ta beslut eller klicka i webbgränssnitt. Överdriv inte åt något håll.

### ✍️-rutor

Använd citatblock där Christoffer behöver fylla i själv:

```markdown
> ✍️ **Fyll i:** Varför du valde Y i stället för Z, och om du skulle göra likadant igen.
```

Formulera dem som konkreta frågor, så att de är lätta att besvara. De hör hemma vid personliga
reflektioner, utfall som inte syntes i sessionen, beslut som togs utanför den och slutsatser.

## Säkerhetsgranska innan du sparar

Anteckningen hamnar på en publik sajt, och utkast kan ligga läsbara i repon. Ta bort eller
generalisera:

- hemligheter, tokens, lösenord och privata nycklar, även i exempel
- interna IP-adresser, värdnamn, MAC-adresser och nätverksdetaljer från homelabbet som gör det lättare att
  angripa (använd `192.168.x.y`, `<värd>` eller liknande)
- kundnamn och detaljer från konsultuppdrag som inte är offentliga, eftersom han jobbar under sekretess
- personuppgifter om honom själv eller andra (adress, telefon, födelsedatum)
- sårbarheter i system som fortfarande är live. Ta bara med dem om de är åtgärdade, och
  skriv i HTML-kommentaren att inlägget inte får publiceras förrän de är det.

## Uppdatera en befintlig anteckning

"Uppdatera labbanteckningen" eller "lägg till det vi gjort sedan sist": leta upp filen under
`labbanteckningar/` (eller `src/content/lab/`) och fråga om det är oklart vilken som avses. Lägg till
i de befintliga avsnitten i stället för att skriva om. Rör inte text Christoffer själv har skrivit,
som ifyllda ✍️-rutor, och flytta sådant som nu är gjort ut ur "Nästa steg".

## Svaret till användaren

Kort och på svenska:
- sökvägen till filen och titeln
- vilka ✍️-rutor som behöver fyllas i
- vad säkerhetsgranskningen tog bort eller flaggade
- en påminnelse om att flytta filen till `src/content/lab/` i sajtens repo när den är klar
