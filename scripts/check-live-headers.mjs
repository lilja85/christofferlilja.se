// Kontrollerar att den publicerade sajten skickar säkerhetsheaders på riktigt.
// Gör GET, inte HEAD: på webbhotellet går HEAD till Apache (som läser .htaccess) medan nginx kan svara
// själv på GET för statiska filer, utan headers. Det var så securityheaders.com gick från A+ till F
// samtidigt som curl -I såg bra ut.
// Kör: node scripts/check-live-headers.mjs [bas-url]   (standard: site.url i site.config.mjs)
import siteConfig from '../site.config.mjs';
import { securityHeaders } from './security-headers.mjs';

const base = (process.argv[2] || siteConfig.site.url).replace(/\/$/, '');

async function get(path) {
  const res = await fetch(base + path, { headers: { 'User-Agent': 'check-live-headers (GitHub Actions)' } });
  return { res, body: await res.text() };
}

// Sidor plus alla skript och stilmallar som startsidan laddar. Alla, inte ett urval: på webbhotellet
// har små filer gått via Apache och större direkt via nginx, så en liten fil kan dölja felet.
const start = await get('/');
const paths = ['/', '/lab/', '/humans.txt'];
for (const m of start.body.matchAll(/(?:src|href)="(\/(?:js|_astro)\/[^"]+\.(?:js|css))"/g)) {
  if (!paths.includes(m[1])) paths.push(m[1]);
}

let failed = 0;
for (const path of paths) {
  const { res } = path === '/' ? start : await get(path);
  const problems = [];
  if (!res.ok && res.status !== 404) problems.push(`status ${res.status}`);
  for (const [name, value] of securityHeaders) {
    const got = res.headers.get(name);
    if (got === null) problems.push(`saknar ${name}`);
    else if (got !== value) problems.push(`${name} har fel värde: ${got}`);
  }
  if (problems.length) {
    failed++;
    console.log(`✗ ${path}\n    ${problems.join('\n    ')}`);
  } else {
    console.log(`✓ ${path}`);
  }
}

if (failed) {
  console.log(`\n${failed} av ${paths.length} adresser saknar säkerhetsheaders på ${base}.`);
  console.log('Kontrollera med GET: curl -sD - -o /dev/null <url> (curl -I gör HEAD och kan ge ett annat svar).');
  process.exit(1);
}
console.log(`\nAlla ${paths.length} adresser skickar säkerhetsheaders.`);
