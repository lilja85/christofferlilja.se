// Körs efter astro build. Skriver säkerhetsheaders i det format som målmiljön förstår:
// - webbhotellet (produktion): Header-rader i dist/.htaccess, på platsen för markören
// - Cloudflare Pages (förhandsvisningar, CF_PAGES=1): dist/_headers med noindex, och ingen .htaccess
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { securityHeaders, textFiles } from './security-headers.mjs';
import siteConfig from '../site.config.mjs';

const MARKER = '# @security-headers';
const htaccess = new URL('../dist/.htaccess', import.meta.url);
const headersFile = new URL('../dist/_headers', import.meta.url);

if (!existsSync(htaccess)) {
  throw new Error('dist/.htaccess saknas. Ligger public/.htaccess kvar?');
}

if (process.env.CF_PAGES) {
  const lines = ['/*', ...securityHeaders.map(([name, value]) => `  ${name}: ${value}`), '  X-Robots-Tag: noindex, nofollow', ''];
  for (const path of textFiles) {
    lines.push(path, '  Content-Type: text/plain; charset=utf-8', '');
  }
  writeFileSync(headersFile, lines.join('\n'));
  // Apache-konfigen hör inte hemma på Cloudflare, och ska inte gå att hämta där
  rmSync(htaccess);
  console.log('postbuild: Cloudflare Pages, skrev dist/_headers (noindex) och tog bort dist/.htaccess');
} else {
  const source = readFileSync(htaccess, 'utf8');
  if (!source.includes(MARKER)) {
    throw new Error(`Markören "${MARKER}" saknas i public/.htaccess, headers skulle tyst falla bort.`);
  }
  const block = [
    '<IfModule mod_headers.c>',
    ...securityHeaders.map(([name, value]) => `  Header always set ${name} "${value}"`),
    '</IfModule>',
  ].join('\n');
  writeFileSync(htaccess, source.replace(MARKER, block));
  if (existsSync(headersFile)) rmSync(headersFile);
  console.log('postbuild: webbhotell, skrev säkerhetsheaders till dist/.htaccess');

  // Startsidan som index.php (site.phpIndex): nginx framför Apache svarar själv på större statiska filer
  // utan headers, men .php går alltid till Apache. Utan PHP-kod i filen skickar PHP ut HTML:en som den är.
  // Bara i GitHub Actions (bygget som deployas), så att npm run preview lokalt har kvar index.html.
  if (siteConfig.site.phpIndex && process.env.GITHUB_ACTIONS) {
    const index = new URL('../dist/index.html', import.meta.url);
    const html = readFileSync(index, 'utf8');
    if (html.includes('<?')) {
      throw new Error('dist/index.html innehåller "<?", som PHP skulle köra. Skriv < som &lt; eller \\u003c.');
    }
    writeFileSync(new URL('../dist/index.php', import.meta.url), html);
    rmSync(index);
    console.log('postbuild: startsidan blev dist/index.php (site.phpIndex)');
  }
}
