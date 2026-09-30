// Validerar topplistan (src/data/hall-of-fame.json). Körs i CI på varje bygge.
// I pull requests som ändrar topplistan (PR_AUTHOR och BASE_REF satta) kontrolleras dessutom att
// PR:en bara ändrar den filen, lägger till exakt en post och att posten gäller PR-författaren.
//
// Kontrollsumman beräknas som i public/js/achievements.js (hofId). Den fångar slarv, inte fusk:
// sajten är statisk och koden publik, så jakten i sig är ett ärlighetssystem. Identiteten är däremot
// verifierad, eftersom posten måste komma från samma GitHub-konto som den gäller.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const FILE = 'src/data/hall-of-fame.json';
// Lanseringsdagen (site.launched i site.config.mjs), innan dess fanns ingen jakt
const LAUNCH = Date.parse(`${siteConfig.site.launched}T00:00:00Z`) / 1000;
const GITHUB_HANDLE = /^(?!-)(?!.*--)[A-Za-z0-9-]{1,39}(?<!-)$/;
const KEYS = ['completed', 'github', 'id'];

const errors = [];
const fail = (msg) => errors.push(msg);

import { hofId } from './hof-id.mjs';
import siteConfig from '../site.config.mjs';

function parse(text, label) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`${label}: ogiltig JSON (${e.message})`);
  }
  if (!Array.isArray(data)) throw new Error(`${label}: ska vara en JSON-array`);
  return data;
}

let entries;
try {
  entries = parse(readFileSync(FILE, 'utf8'), FILE);
} catch (e) {
  console.error(`Topplistan är inte godkänd:
- ${e.message}`);
  process.exit(1);
}
const now = Math.floor(Date.now() / 1000);
const seen = new Set();

entries.forEach((e, i) => {
  const where = `post ${i + 1}`;
  if (typeof e !== 'object' || e === null || Array.isArray(e)) return fail(`${where}: ska vara ett objekt`);
  const keys = Object.keys(e).sort();
  if (keys.join(',') !== KEYS.join(',')) return fail(`${where}: ska ha exakt fälten ${KEYS.join(', ')} (har ${keys.join(', ')})`);
  if (typeof e.github !== 'string' || !GITHUB_HANDLE.test(e.github)) fail(`${where}: "${e.github}" är inte ett giltigt GitHub-användarnamn`);
  if (!Number.isInteger(e.completed)) fail(`${where}: completed ska vara ett heltal (unix-sekunder)`);
  else if (e.completed < LAUNCH) fail(`${where}: completed ${e.completed} är före lanseringen (${LAUNCH})`);
  else if (e.completed > now + 3600) fail(`${where}: completed ${e.completed} ligger i framtiden`);
  if (typeof e.github === 'string' && Number.isInteger(e.completed) && e.id !== hofId(e.github, e.completed)) {
    fail(`${where}: id "${e.id}" stämmer inte. Kopiera raden från certifikatet på sajten igen.`);
  }
  const lower = String(e.github).toLowerCase();
  if (seen.has(lower)) fail(`${where}: ${e.github} finns redan på topplistan (en plats per konto)`);
  seen.add(lower);
});

// Extra kontroller i pull requests från andra än repots ägare, när topplistan redan finns på basbranchen.
// Ägarens egna PR:er (t.ex. som ändrar kod eller själva topplistefunktionen) valideras bara på format och id.
const { PR_AUTHOR, BASE_REF, REPO_OWNER } = process.env;
const fromOwner = PR_AUTHOR && REPO_OWNER && PR_AUTHOR.toLowerCase() === REPO_OWNER.toLowerCase();
if (PR_AUTHOR && BASE_REF && !fromOwner) {
  // stderr fångas, så att git inte skriver "fatal:" i loggen för fel som hanteras här
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const changed = git('diff', '--name-only', `origin/${BASE_REF}...HEAD`).split('\n').filter(Boolean);
  let base = null;
  try {
    base = parse(git('show', `origin/${BASE_REF}:${FILE}`), `${FILE} på ${BASE_REF}`);
  } catch (e) {
    if (!/does not exist|exists on disk, but not in/.test(String(e.stderr || e.message))) throw e;
  }
  if (base && changed.includes(FILE)) {
    const others = changed.filter((f) => f !== FILE);
    if (others.length) fail(`En PR till topplistan får bara ändra ${FILE}, men ändrar också: ${others.join(', ')}`);
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    base.forEach((b, i) => {
      if (!same(b, entries[i])) fail(`Post ${i + 1} (${b.github}) har ändrats eller tagits bort. Lägg bara till din egen rad, sist.`);
    });
    const added = entries.length - base.length;
    if (added !== 1) fail(`En PR ska lägga till exakt en post, den här lägger till ${added}.`);
    const mine = entries[entries.length - 1];
    if (added === 1 && mine && String(mine.github).toLowerCase() !== PR_AUTHOR.toLowerCase()) {
      fail(`Den nya posten gäller ${mine.github}, men PR:en är öppnad av ${PR_AUTHOR}. Man lägger bara till sig själv.`);
    }
  }
}

if (errors.length) {
  console.error(`Topplistan är inte godkänd:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Topplistan är godkänd (${entries.length} ${entries.length === 1 ? 'post' : 'poster'}).`);
