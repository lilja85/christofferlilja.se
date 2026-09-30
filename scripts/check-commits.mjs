// Kontrollerar att commit-meddelandena i en PR följer Conventional Commits. PR:er mergas med vanliga
// merge-commits, så varje commit i PR:en hamnar på main. Merge-commits hoppas över.
// Körs i CI med BASE_REF (och PR_AUTHOR för förslaget i felmeddelandet).
// Lokalt: BASE_REF=main node scripts/check-commits.mjs
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
const PATTERN = new RegExp(`^(${TYPES.join('|')})(\\([a-z0-9-]+\\))?!?: \\S`);

const { BASE_REF, PR_AUTHOR = '', GITHUB_STEP_SUMMARY } = process.env;
if (!BASE_REF) {
  console.log('Ingen BASE_REF, inget att kontrollera.');
  process.exit(0);
}

// Lokalt finns kanske bara main och inte origin/main
const base = spawnSync('git', ['rev-parse', '--verify', '--quiet', `origin/${BASE_REF}`]).status === 0 ? `origin/${BASE_REF}` : BASE_REF;
const log = execFileSync('git', ['log', '--no-merges', '--format=%h%x09%s', `${base}..HEAD`], { encoding: 'utf8' });
const commits = log.split('\n').filter(Boolean).map((l) => {
  const [hash, ...rest] = l.split('\t');
  return { hash, subject: rest.join('\t') };
});
const bad = commits.filter((c) => !PATTERN.test(c.subject));

if (!bad.length) {
  console.log(`${commits.length} commit(s) följer Conventional Commits.`);
  process.exit(0);
}

const alias = PR_AUTHOR || 'ditt-alias';
const message = [
  'Commit-meddelandena ska följa Conventional Commits (typ(omfång): beskrivning). De här gör inte det:',
  ...bad.map((c) => `  ${c.hash}  ${c.subject}`),
  '',
  `Ska du in på topplistan? Commit-meddelandet ska vara: feat(hof): lägg till @${alias}`,
  'Det går inte att ändra i GitHubs webbgränssnitt. Enklast är att stänga PR:en och göra om den via',
  '"Öppna filen på GitHub" i certifikatet och skriva meddelandet ovan i rutan "Commit changes".',
  `Med git: git commit --amend -m "feat(hof): lägg till @${alias}" och sedan git push --force.`,
  '',
  `Annars: börja meddelandet med en av ${TYPES.join(', ')}, t.ex. "fix(terminal): Esc stänger terminalen".`,
  'Flera commits rättas med git rebase -i. Mer om formatet: https://www.conventionalcommits.org/sv/v1.0.0/',
].join('\n');

// ::error:: syns som en annotering i PR:en, sammanfattningen på körningens sida
console.log(`::error title=Commit-meddelanden behöver ändras::${message.replace(/%/g, '%25').replace(/\r?\n/g, '%0A')}`);
if (GITHUB_STEP_SUMMARY) {
  appendFileSync(GITHUB_STEP_SUMMARY, `### Commit-meddelanden behöver ändras\n\n\`\`\`\n${message}\n\`\`\`\n`);
}
process.exit(1);
