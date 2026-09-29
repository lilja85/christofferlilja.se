// Kontrollsumman för en topplistepost. Samma beräkning som hofId i public/js/achievements.js.
// Fast fras (Elliot i Mr. Robot), så att nya ägg inte påverkar befintliga poster.
import { createHash } from 'node:crypto';

export const HOF_SALT = 'Hello, friend.';

export function hofId(github, completed) {
  return createHash('sha256').update(`${github.toLowerCase()}|${completed}|${HOF_SALT}`).digest('hex').slice(0, 8);
}
