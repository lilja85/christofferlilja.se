export const SITE = {
  name: 'Christoffer Lilja',
  title: 'DevSecOps-konsult och lösningsarkitekt',
  location: 'Jönköping',
  email: 'christoffer.lilja@gmail.com',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/lilja85/' },
    // { label: 'GitHub', href: 'https://github.com/<användarnamn>' },
  ],
};

export const formatDate = (d: Date) =>
  d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
