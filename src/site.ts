// Konfigurationen från site.config.mjs med standardvärden och härledda värden ifyllda.
// Astro-sidorna importerar härifrån; påskäggen i public/js/ får publicConfig() inbäddad i sidan.
import config from '../site.config.mjs';
import type { SiteConfig } from './config-types';

const raw = config as SiteConfig;
const { site, person, profile, avatar, features, retro } = raw;
const url = new URL(site.url);

const eggsOn = features.eggs;

export const CONFIG = {
  site: {
    ...site,
    host: url.host,
    repoUrl: `https://github.com/${site.repo}`,
  },
  person,
  profile: { focusHeading: 'Det här jobbar jag med', ...profile },
  avatar: { glassesRetro: avatar.glasses, ...avatar },
  features: {
    eggs: eggsOn,
    // Temat och topplistan bygger på terminalen, så de kräver påskäggen
    retro: eggsOn && features.retro,
    hallOfFame: eggsOn && features.hallOfFame,
    lab: features.lab,
  },
  retro,
  eggs: {
    osName: `${person.firstName}OS`,
    biosVendor: `${person.lastName} Megatrends Inc.`,
    biosSince: new Date().getFullYear() - 40,
    blame: null as { commit: string; date: string; line: string; note?: string } | null,
    about: [`${person.title}${person.location ? ` i ${person.location}` : ''}.`],
    tagline: 'nörd',
    ...raw.eggs,
  },
  humans: {
    thanks: [] as string[],
    hosting: 'GitHub Actions',
    ...raw.humans,
  },
  initials: (person.firstName[0] + person.lastName[0]).toUpperCase(),
};

// Kort form för sidhuvud och titlar (samma fält som tidigare SITE)
export const SITE = {
  name: person.name,
  title: person.title,
  location: person.location,
  email: person.email,
  links: person.links,
};

// Det påskäggen i public/js/ behöver. Bäddas in som JSON i sidan, så inget hemligt här.
export function publicConfig() {
  return {
    url: CONFIG.site.url,
    host: CONFIG.site.host,
    repo: CONFIG.site.repo,
    repoUrl: CONFIG.site.repoUrl,
    previewUrl: CONFIG.site.previewUrl,
    launched: CONFIG.site.launched,
    name: person.name,
    firstName: person.firstName,
    handle: person.handle,
    email: person.email,
    title: person.title,
    location: person.location,
    links: person.links,
    features: CONFIG.features,
    eggs: CONFIG.eggs,
    retroHeader: retro.headerImage,
  };
}

export const formatDate = (d: Date) =>
  d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
