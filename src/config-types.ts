// Typer för site.config.mjs (används via JSDoc i den filen, så att editorn kan hjälpa till).

export interface SiteConfig {
  site: {
    url: string;
    repo: string;
    previewUrl: string | null;
    launched: string;
    phpIndex?: boolean;
  };
  person: {
    name: string;
    firstName: string;
    lastName: string;
    handle: string;
    github: string;
    title: string;
    company?: string;
    location: string;
    country?: string;
    email: string;
    links: { label: string; href: string }[];
  };
  profile: {
    intro: string[];
    focusHeading?: string;
    focus: { title: string; text: string }[];
    clients: string[];
  };
  avatar: {
    glasses: { top: number; left: number };
    glassesRetro?: { top: number; left: number };
  };
  features: {
    eggs: boolean;
    retro: boolean;
    hallOfFame: boolean;
    lab: boolean;
  };
  retro: {
    headerImage: string | null;
  };
  eggs?: {
    osName?: string;
    biosVendor?: string;
    biosSince?: number;
    blame?: { commit: string; date: string; line: string; note?: string };
    about?: string[];
    tagline?: string;
  };
  humans?: {
    thanks?: string[];
    hosting?: string;
  };
}
