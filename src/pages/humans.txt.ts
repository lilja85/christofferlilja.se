import { textResponse } from '../lib/text';
import { CONFIG } from '../site';

const { person, humans, features } = CONFIG;
const place = [person.location, person.country].filter(Boolean).join(', ');
const lines = [
  '/* TEAM */',
  `Utvecklare: ${person.name}`,
  `Roll: ${person.title}`,
  place && `Ort: ${place}`,
  ...person.links.map((l) => `${l.label}: ${l.href}`),
  '',
  ...(humans.thanks.length ? ['/* TACK */', ...humans.thanks, ''] : []),
  '/* SITE */',
  'Byggd med: Astro, HTML, CSS och lite vanilla-JS',
  `Publicerad med: ${humans.hosting}`,
  'Kakor: inga',
  'Spårning: ingen',
  features.eggs ? 'Påskägg: ja (tips: tryck "." på sidan)' : null,
].filter((l) => l !== null && l !== false);

export const GET = () => textResponse(lines.join('\n') + '\n');
