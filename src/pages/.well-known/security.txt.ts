import { textResponse } from '../../lib/text';
import { CONFIG } from '../../site';

// RFC 9116. Expires måste ligga högst ett år fram, så datumet sätts vid varje bygge.
const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
const { site, person } = CONFIG;

export const GET = () =>
  textResponse(`# Hittat en sårbarhet på ${site.host}? Tack! Hör av dig så fixar jag det.
# Det här är en statisk sida utan backend, men man vet aldrig. 😉
Contact: mailto:${person.email}
Expires: ${expires}
Preferred-Languages: sv, en
Canonical: ${site.url}/.well-known/security.txt
`);
