---
title: 'Homelab del 1: Proxmox och Pi-hole'
description: 'Startpunkten för mitt homelab: en Proxmox-server i källaren med Pi-hole som första tjänst.'
date: 2026-09-27
tags: [homelab, proxmox, dns]
draft: true
---

<!-- UTKAST: skriv om med egna erfarenheter och ta bort draft: true innan publicering -->

Jag har precis börjat bygga ett homelab. Just nu består det av en Proxmox-server i källaren
som bara kör en enda sak: [Pi-hole](https://pi-hole.net/) som DNS för hemnätverket.

## Varför?

I jobbet arbetar jag med säker leveranskedja, infrastruktur som kod och behörigheter,
men det mesta sker i andras miljöer. Här kan jag testa saker från grunden, göra fel och
skriva ner vad jag lärt mig.

## Nuläge

- **Proxmox VE** installerat på hårdvaran.
- **Pi-hole** som DNS och reklamfilter för nätverket.

## Nästa steg

- Hantera Proxmox med Terraform i stället för att klicka i webbgränssnittet.
- Backup av containrar och VM:ar.
- Säker fjärråtkomst utan att öppna portar.
- Härdning och övervakning.
