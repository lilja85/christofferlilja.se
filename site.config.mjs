// Allt personligt på sajten samlat på ett ställe. Forka repot och ändra här för att göra sajten till din egen
// (se "Gör den till din egen" i README). Filen läses både av Astro och av skripten i scripts/.
//
// Påskäggen i public/js/ får en publik delmängd av det här via <script id="site-config"> i src/layouts/Base.astro.
// Lägg inga hemligheter här: allt i filen kan hamna på sajten.

/** @type {import('./src/config-types').SiteConfig} */
export default {
  site: {
    // Sajtens adress i produktion, utan snedstreck på slutet
    url: 'https://christofferlilja.se',
    // GitHub-repot som owner/namn (används för topplistan, git remote-påskägget och förhandsvisningsbannern)
    repo: 'lilja85/christofferlilja.se',
    // Cloudflare Pages-adressen för förhandsvisningar, eller null om du inte använder det
    previewUrl: 'https://christofferlilja-se.pages.dev',
    // Dagen sajten (och påskäggsjakten) gick live. Topplisteposter före det här datumet avvisas.
    launched: '2026-09-28',
  },

  person: {
    name: 'Christoffer Lilja',
    firstName: 'Christoffer',
    lastName: 'Lilja',
    // Kort alias med gemener utan mellanslag, används i terminalen (t.ex. "sudo hire christoffer")
    handle: 'christoffer',
    github: 'lilja85',
    title: 'DevSecOps Engineer',
    company: 'Consid',
    location: 'Jönköping',
    country: 'Sverige',
    email: 'christoffer.lilja@gmail.com',
    // Första länken används också som "Fullständig historik finns på …"
    links: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/lilja85/' }],
  },

  profile: {
    intro: [
      'Jag har jobbat som .NET-utvecklare sedan 2007. De senaste åren har jag mest arbetat med utvecklings- och leveranskedjan, med fokus på säkerhet. Just nu arbetar jag mest med behörighetshantering (IAM/IGA), och mycket i OpenTexts produkter, men också med kringsystem och integrationer.',
      'Utvecklarbakgrunden gör att jag förstår varför team ibland går runt säkerheten. Därför bygger jag hellre lösningar som teamen faktiskt vill använda än regler de måste följa.',
    ],
    focusHeading: 'Det här jobbar jag med',
    focus: [
      { title: 'Säker leveranskedja', text: 'Azure DevOps och GitHub: behörighetsmodeller, branch policies och GitHub Advanced Security. Hotmodellering och workshops så att teamen förstår varför, inte bara hur.' },
      { title: 'Infrastruktur som kod', text: 'Terraform och Bicep i pipelines som granskar och rullar ut ändringar automatiskt. Teamen behåller farten utan att vänta på någon med rätt behörighet.' },
      { title: 'Azure & identitet', text: 'Entra ID med PIM, Key Vault, API Management, AKS, Functions och Defender for Cloud. Lösningar som utvärderas mot Well-Architected Framework.' },
      { title: 'IAM/IGA', text: 'Behörighetshantering i OpenText IAM/IGA: least privilege, segregation of duties och governance med återkommande granskning av vem som har åtkomst.' },
    ],
    // Visas som "Uppdrag i urval: …". Tom lista = raden visas inte.
    clients: ['If', 'Norion Bank', 'Nexthink', 'GSK', 'Sandvik Coromant'],
  },

  avatar: {
    // Var "deal with it"-glasögonen landar i sudo-läge, i procent av bilden. Beror på var ögonen sitter i
    // src/assets/avatar.jpg, så justera när du byter bild. glassesRetro gäller den fyrkantiga 2008-avataren.
    glasses: { top: 47, left: 30 },
    glassesRetro: { top: 45, left: 26 },
  },

  features: {
    // Terminalen, sudo, kraschen, rate limit, achievements med mera. Av = vanlig profilsida med temaknapp.
    eggs: true,
    // 2008-temat (theme 2008 i terminalen). Kräver eggs.
    retro: true,
    // Topplistan via pull requests. Kräver eggs.
    hallOfFame: true,
    // Labbanteckningarna och Lab-länken
    lab: true,
  },

  retro: {
    // Headerbilden i 2008-temat (640 × 134 px, med namnet i bilden), eller null för en generisk header med namnet i text
    headerImage: '/retro/header.png',
  },

  // Texter i påskäggen. Allt här är valfritt och får standardvärden från person om det saknas.
  eggs: {
    osName: 'ChristofferOS',
    biosVendor: 'Lilja Megatrends Inc.',
    biosSince: 1985,
    // git blame i terminalen: en rad från en gammal sida, med vem som skrev den och när
    blame: {
      commit: '7e55a5c',
      date: '2008-03-26',
      line: '<?php echo $myAge; ?>',
      note: 'Ja, det var jag. Allt är mitt fel. Sedan 2004.',
    },
    // "cat about.txt" i terminalen
    about: [
      'Utvecklare sedan 2007, numera mest säkerhet i leveranskedjan:',
      'Azure DevOps, GitHub Advanced Security, Terraform, Entra ID och IAM/IGA.',
      'Bygger hellre lösningar som teamen vill använda än regler de måste följa.',
    ],
    // Står efter handle i konsolhälsningen: "christoffer  (devsecops, nörd)"
    tagline: 'devsecops, nörd',
  },

  humans: {
    thanks: ['Min första hemsida, handkodad i PHP och XHTML runt 2004–2008.', 'Den lärde mig mer än någon kurs.'],
    hosting: 'GitHub Actions och FTPS till mitt webbhotell',
  },
};
