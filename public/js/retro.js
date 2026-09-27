// Påskägg: 2008-läget. Lägger till 00-talsdetaljer när data-theme="2008" och tar bort dem igen annars.
(function () {
  var root = document.documentElement;
  var added = [];
  var ORIGINAL_TITLE = document.title;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    e.className = 'retro-only ' + cls;
    if (html) e.innerHTML = html;
    added.push(e);
    return e;
  }

  function toast(text) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = text;
    t.hidden = false;
    setTimeout(function () { t.hidden = true; }, 4000);
  }

  // Besöksräknaren räknar på riktigt (i din egen webbläsare) ovanpå ett rimligt 2008-startvärde
  function visitorNumber() {
    var n = 0;
    try {
      n = parseInt(localStorage.getItem('retro-visits') || '0', 10) + 1;
      localStorage.setItem('retro-visits', String(n));
    } catch (e) {}
    return String(4711 + n).padStart(6, '0');
  }

  // "Senast ändrad fredag den 27 september 2026 av Christoffer Lilja", som strftime_swedish gjorde
  function lastModified() {
    var d = new Date(document.lastModified);
    if (isNaN(d)) d = new Date();
    var days = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];
    var months = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
    return 'Senast ändrad ' + days[d.getDay()] + ' den ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ' av Christoffer Lilja';
  }

  function sparkle(e) {
    if (Math.random() > 0.35) return;
    var s = document.createElement('span');
    s.className = 'retro-sparkle';
    s.textContent = ['✦', '✧', '★', '·'][Math.floor(Math.random() * 4)];
    s.style.left = e.clientX + 6 + 'px';
    s.style.top = e.clientY + 6 + 'px';
    s.style.color = ['#ff00ff', '#ffcc00', '#00ccff', '#ff3366'][Math.floor(Math.random() * 4)];
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 800);
  }
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function enable() {
    if (added.length) return;
    var header = document.querySelector('.site-header');
    var main = document.querySelector('main');
    var footer = document.querySelector('.site-footer');
    var nav = header && header.querySelector('nav');

    var marquee = el('div', 'retro-marquee',
      '<span>~*~ Välkommen till min hemsida!!! ~*~ Sidan visas bäst i 1024x768 med Firefox 2.0 ~*~ ' +
      'Glöm inte att signera gästboken!!! ~*~ Nu med Web 2.0 och AJAX ~*~ Senaste nytt: labbet är öppnat! ~*~</span>');
    header.insertAdjacentElement('afterend', marquee);

    var construction = el('div', 'retro-construction',
      '<b>🚧 UNDER KONSTRUKTION 🚧</b> <span class="retro-blink">Sidan byggs fortfarande om. Kom tillbaka snart!</span>');
    main.insertAdjacentElement('afterbegin', construction);

    var labLink = nav && nav.querySelector('a[href="/lab/"]');
    if (labLink) labLink.insertAdjacentElement('afterend', el('span', 'retro-new retro-blink', 'NY!'));

    if (nav) {
      var guest = el('a', 'retro-guestbook', 'Gästbok');
      guest.href = '#gastbok';
      guest.addEventListener('click', function (e) {
        e.preventDefault();
        toast('Gästboken är tyvärr stängd pga spam (sedan 2009). Skicka ett mejl istället! 📧');
      });
      nav.insertBefore(guest, nav.querySelector('.theme-toggle'));
    }

    var digits = visitorNumber().split('').map(function (d) { return '<span>' + d + '</span>'; }).join('');
    footer.insertAdjacentElement('afterbegin', el('div', 'retro-counter', 'Du är besökare nummer <span class="digits">' + digits + '</span>'));
    footer.appendChild(el('div', 'retro-badges',
      '<span class="b-xhtml"><i>W3C</i> XHTML 1.0 ✔</span>' +
      '<span class="b-firefox">Get Firefox!</span>' +
      '<span class="b-notepad">Made with Notepad</span>' +
      '<span class="b-php">PHP POWERED</span>' +
      '<span class="b-res">800x600 or better</span>'));
    footer.appendChild(el('p', 'retro-updated', lastModified()));

    document.title = '~*~ ' + ORIGINAL_TITLE + ' ~*~';
    if (!reducedMotion) document.addEventListener('mousemove', sparkle);
  }

  function disable() {
    added.forEach(function (e) { e.remove(); });
    added = [];
    document.title = ORIGINAL_TITLE;
    document.removeEventListener('mousemove', sparkle);
  }

  function sync() {
    if (root.dataset.theme === '2008') enable();
    else disable();
  }

  document.addEventListener('themechange', sync);
  sync();
})();
