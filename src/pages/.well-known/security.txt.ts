import { textResponse } from '../../lib/text';

// RFC 9116. Expires måste ligga högst ett år fram, så datumet sätts vid varje bygge.
const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

export const GET = () =>
  textResponse(`# Hittat en sårbarhet på christofferlilja.se? Tack! Hör av dig så fixar jag det.
# Det här är en statisk sida utan backend, men man vet aldrig. 😉
Contact: mailto:christoffer.lilja@gmail.com
Expires: ${expires}
Preferred-Languages: sv, en
Canonical: https://christofferlilja.se/.well-known/security.txt
`);
