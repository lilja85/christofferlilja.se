// Säkerhetsheaders för sajten, på ett ställe.
// scripts/postbuild.mjs skriver dem till dist/.htaccess (produktion på webbhotellet)
// eller till dist/_headers (förhandsvisningar på Cloudflare Pages). Ändra dem här, inte i .htaccess.

export const securityHeaders = [
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains'],
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
  [
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'none'",
    ].join('; '),
  ],
];

// Textfiler som behöver uttrycklig teckenkodning där servern inte sätter den själv
export const textFiles = ['/humans.txt', '/robots.txt', '/.well-known/security.txt'];
