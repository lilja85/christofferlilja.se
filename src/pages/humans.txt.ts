import { textResponse } from '../lib/text';

export const GET = () =>
  textResponse(`/* TEAM */
Utvecklare: Christoffer Lilja
Roll: DevSecOps-konsult och lösningsarkitekt
Ort: Jönköping, Sverige
LinkedIn: https://www.linkedin.com/in/lilja85/

/* TACK */
Min första hemsida, handkodad i PHP och XHTML runt 2004–2008.
Den lärde mig mer än någon kurs.

/* SITE */
Byggd med: Astro, HTML, CSS och lite vanilla-JS
Publicerad med: GitHub Actions och FTPS till mitt webbhotell
Kakor: inga
Spårning: ingen
Påskägg: ja (tips: tryck "." på sidan)
`);
