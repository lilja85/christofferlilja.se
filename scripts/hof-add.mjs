// Lägger till en post i topplistan med rätt kontrollsumma, för den som mejlat i stället för att göra en PR.
// Kör: node scripts/hof-add.mjs <github-alias> <completed>
// (completed är unix-tiden i mejlet). Kör sedan node scripts/validate-hall-of-fame.mjs och gör en PR som vanligt.
import { readFileSync, writeFileSync } from 'node:fs';
import { hofId } from './hof-id.mjs';

const FILE = 'src/data/hall-of-fame.json';
const [github, completedArg] = process.argv.slice(2);
const completed = Number(completedArg);

if (!github || !Number.isInteger(completed)) {
  console.error('Användning: node scripts/hof-add.mjs <github-alias> <completed>');
  process.exit(1);
}

const entries = JSON.parse(readFileSync(FILE, 'utf8'));
if (entries.some((e) => e.github.toLowerCase() === github.toLowerCase())) {
  console.error(`${github} finns redan på topplistan.`);
  process.exit(1);
}
entries.push({ github, completed, id: hofId(github, completed) });
writeFileSync(FILE, JSON.stringify(entries, null, 2) + '\n');
console.log(`Lade till ${github} (completed ${completed}, id ${entries.at(-1).id}).`);
