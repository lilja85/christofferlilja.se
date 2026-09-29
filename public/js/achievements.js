// Påskäggsjakten: vilka ägg som finns, vilka besökaren hittat (localStorage, bara i den egna webbläsaren),
// Xbox-lik notis, räknare i sidfoten och fyrverkerier + certifikat när alla är hittade.
// Nya ägg: lägg till dem i EGGS och anropa window.Eggs.unlock('id') där de utlöses.
(function () {
  var EGGS = [
    { id: 'terminal', title: 'Hello, world', desc: 'Öppnade den hemliga terminalen.', hint: 'Tryck på en tangent som GitHub-folk känner igen.' },
    { id: 'konami', title: '↑↑↓↓←→←→BA', desc: 'Knappade in Konami-koden.', hint: 'En klassisk fuskkod från 80-talet.' },
    { id: 'sudo-l', title: 'RTFM', desc: 'Kollade vad du får göra med sudo -l.', hint: 'Fråga sudo vad du får göra.' },
    { id: 'least-privilege', title: 'Least privilege hero', desc: 'Lämnade frivilligt tillbaka sudo.', hint: 'Förhöjd behörighet ska lämnas tillbaka.' },
    { id: 'sandwich', title: 'Sandwich artist', desc: 'sudo make me a sandwich (xkcd #149).', hint: 'Be om en macka. Artigt, med rätt behörighet.' },
    { id: 'nedry', title: 'Magic word', desc: 'Ah ah ah! Du sa inte det magiska ordet.', hint: 'Försök förstöra något utan behörighet.' },
    { id: 'crash', title: 'Blue screen of life', desc: 'Körde sudo rm -rf /* och kraschade allt.', hint: 'Det farligaste kommandot som finns. Med sudo.' },
    { id: 'vim', title: 'Escaped vim', desc: 'Tog dig ur vim. Det klarar inte alla.', hint: 'Öppna en editor som är känd för att vara svår att lämna.' },
    { id: 'lockout', title: 'Back in sudoers', desc: 'Klarade säkerhetskontrollen efter kraschen.', hint: 'Bli spärrad, och ta dig tillbaka.' },
    { id: 'hal', title: "I can't do that, Dave", desc: 'Försökte stänga av HAL 9000.', hint: 'Försök stänga av systemet.' },
    { id: 'wargames', title: 'The only winning move', desc: 'Startade ett globalt termonukleärt krig.', hint: 'Shall we play a game? Starta något.' },
    { id: 'itcrowd', title: 'Have you tried…', desc: '…turning it off and on again?', hint: 'Starta om.' },
    { id: 'hire', title: 'Good call', desc: 'sudo hire christoffer. Utmärkt val.', hint: 'Anställ någon. Med sudo.' },
    { id: 'retro', title: 'Best viewed in 1024×768', desc: 'Reste tillbaka till 2008.', hint: 'Byt tema till ett visst år.' },
    { id: 'guestbook', title: 'Signera gästboken', desc: 'Försökte signera en gästbok från 2008.', hint: 'Varje riktig 00-talssajt hade en.' },
    { id: 'ratelimit', title: '429 Too Many Requests', desc: 'Blev rate limitad av temaknappen.', hint: 'Byt tema. Ofta. Snabbt.' },
    { id: 'sentinel', title: 'Incident #4711', desc: 'Ignorerade Retry-After tills Sentinel reagerade.', hint: 'Ignorera en rate limit riktigt länge.' },
    { id: 'merge', title: 'Conflict resolved', desc: 'Löste en merge-konflikt i temat.', hint: 'Två ändringar samtidigt blir sällan bra.' },
    { id: 'remote', title: 'Where the previews live', desc: 'Hittade förhandsvisningarna med git remote -v.', hint: 'Fråga git var koden bor.' },
    { id: '404', title: 'Not found', desc: 'Hittade en sida som inte finns.', hint: 'Gå vilse.' }
  ];
  var KEY = 'eggs';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }
  var found = load().filter(function (id) { return EGGS.some(function (e) { return e.id === id; }); });

  function byId(id) {
    for (var i = 0; i < EGGS.length; i++) if (EGGS[i].id === id) return EGGS[i];
    return null;
  }

  // --- Räknare i sidfoten (syns först efter första ägget) --------------------
  function updateCounter() {
    var el = document.getElementById('egg-counter');
    if (!el) return;
    el.hidden = found.length === 0;
    el.textContent = '🥚 ' + found.length + '/' + EGGS.length;
    el.title = 'Påskägg: ' + found.length + ' av ' + EGGS.length + '. Klicka för att se vilka.';
  }

  // --- Xbox-lik notis --------------------------------------------------------
  var queue = [];
  var showing = false;
  function notify(egg, count) {
    queue.push({ egg: egg, count: count });
    if (!showing) next();
  }
  function next() {
    var item = queue.shift();
    if (!item) { showing = false; return; }
    var egg = item.egg;
    showing = true;
    var n = document.createElement('div');
    n.className = 'ach-toast';
    n.setAttribute('role', 'status');
    n.innerHTML = '<span class="ach-icon" aria-hidden="true">🏆</span><span class="ach-text"><small>Achievement unlocked · ' +
      item.count + '/' + EGGS.length + '</small><strong></strong></span>';
    n.querySelector('strong').textContent = egg.title;
    document.body.appendChild(n);
    setTimeout(function () { n.classList.add('out'); }, 3600);
    setTimeout(function () { n.remove(); next(); }, 4000);
  }

  function unlock(id) {
    var egg = byId(id);
    if (!egg || found.indexOf(id) !== -1) return false;
    found.push(id);
    save(found);
    updateCounter();
    notify(egg, found.length);
    console.log('%c🏆 Achievement unlocked: ' + egg.title + ' (' + found.length + '/' + EGGS.length + ')',
      'color:#b48cff;font-family:monospace');
    if (found.length === EGGS.length) {
      completedAt(); // sätter tidsstämpeln första gången
      setTimeout(celebrate, 1500);
    }
    return true;
  }

  function reset() {
    found = [];
    save(found);
    try { localStorage.removeItem(COMPLETED_KEY); } catch (e) {}
    updateCounter();
  }

  // --- Topplistan (src/data/hall-of-fame.json) ----------------------------------
  // Tidsstämpeln för när alla ägg var hittade, i unix-sekunder. Sätts en gång.
  var COMPLETED_KEY = 'eggs-completed';
  function completedAt() {
    if (found.length !== EGGS.length) return null;
    var t = null;
    try { t = parseInt(localStorage.getItem(COMPLETED_KEY) || '', 10); } catch (e) {}
    if (!t) {
      t = Math.floor(Date.now() / 1000);
      try { localStorage.setItem(COMPLETED_KEY, String(t)); } catch (e) {}
    }
    return t;
  }

  // Samma regler som GitHub för användarnamn
  var GITHUB_HANDLE = /^(?!-)(?!.*--)[A-Za-z0-9-]{1,39}(?<!-)$/;

  // Kontrollsumma för topplisteposten. Samma beräkning i scripts/validate-hall-of-fame.mjs.
  // Den fångar slarv, inte fusk: koden är publik, så ärlighet är en del av spelet.
  var HOF_SALT = 'Hello, friend.'; // Elliot i Mr. Robot. Samma i scripts/validate-hall-of-fame.mjs.
  function hofId(github, completed) {
    var input = github.toLowerCase() + '|' + completed + '|' + HOF_SALT;
    if (!window.crypto || !crypto.subtle) return Promise.resolve('00000000');
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf).slice(0, 4), function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    });
  }

  // --- Fyrverkerier ------------------------------------------------------------
  var COLORS = ['#5cc5a7', '#ffe27a', '#ff6b5a', '#7fe7ff', '#ffffff', '#b48cff', '#ff9ad5'];
  var fw = null;

  function fireworks(ms) {
    if (reducedMotion) return;
    if (fw) { fw.until = Math.max(fw.until, performance.now() + ms); return; }
    var canvas = document.createElement('canvas');
    canvas.className = 'ach-fireworks';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    function resize() {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    var rockets = [];
    var sparks = [];
    var lastLaunch = 0;
    fw = { until: performance.now() + ms };

    function launch() {
      rockets.push({
        x: innerWidth * (0.15 + Math.random() * 0.7),
        y: innerHeight,
        vx: (Math.random() - 0.5) * 2,
        vy: -(innerHeight / 70 + Math.random() * 3),
        // spricker någonstans mellan 15 och 55 procent från toppen
        burstAt: innerHeight * (0.15 + Math.random() * 0.4),
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      });
    }
    function explode(r) {
      var count = 70 + Math.floor(Math.random() * 40);
      for (var i = 0; i < count; i++) {
        var a = Math.PI * 2 * i / count;
        var speed = 2 + Math.random() * 4;
        sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 1, size: 2 + Math.random() * 1.5, color: Math.random() < 0.8 ? r.color : '#ffffff' });
      }
    }
    // Direktstart: några explosioner på en gång, som när Outlook firar
    for (var k = 0; k < 3; k++) {
      explode({ x: innerWidth * (0.25 + k * 0.25), y: innerHeight * (0.25 + Math.random() * 0.15), color: COLORS[k] });
    }

    function frame(now) {
      // Tona ut förra bilden i stället för att rensa den, så att gnistorna får svansar
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.fillRect(0, 0, innerWidth, innerHeight);
      ctx.globalCompositeOperation = 'lighter';
      if (now < fw.until && now - lastLaunch > 350) { launch(); lastLaunch = now; }
      rockets = rockets.filter(function (r) {
        r.x += r.vx; r.y += r.vy; r.vy += 0.12;
        ctx.fillStyle = r.color;
        ctx.fillRect(r.x - 2, r.y - 2, 4, 4);
        if (r.y <= r.burstAt || r.vy >= -1) { explode(r); return false; }
        return true;
      });
      sparks = sparks.filter(function (s) {
        s.x += s.vx; s.y += s.vy; s.vy += 0.05; s.vx *= 0.985; s.vy *= 0.985; s.life -= 0.01;
        ctx.globalAlpha = Math.max(s.life, 0);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return s.life > 0;
      });
      ctx.globalCompositeOperation = 'source-over';
      if (now < fw.until || rockets.length || sparks.length) {
        requestAnimationFrame(frame);
      } else {
        window.removeEventListener('resize', resize);
        canvas.remove();
        fw = null;
      }
    }
    requestAnimationFrame(frame);
  }

  // --- Finalen: Congratulations + certifikat + topplistan -------------------------
  var HOF_EDIT_URL = 'https://github.com/lilja85/christofferlilja.se/edit/main/src/data/hall-of-fame.json';

  // openHof: visa "Ta plats på topplistan" utfälld (när man själv öppnar dialogen igen)
  function celebrate(openHof) {
    if (document.querySelector('.ach-final')) return;
    var completed = completedAt() || Math.floor(Date.now() / 1000);
    var date = new Date(completed * 1000).toISOString().slice(0, 10);
    fireworks(6000);
    var o = document.createElement('div');
    o.className = 'ach-final';
    o.innerHTML =
      '<div class="ach-card" role="dialog" aria-modal="true" aria-labelledby="ach-congrats">' +
      '<h2 id="ach-congrats"><span class="ach-congrats">Congratulations!</span></h2>' +
      '<p>Du har hittat alla ' + EGGS.length + ' påskägg på christofferlilja.se.</p>' +
      '<div class="ach-cert">' +
      '<small>Certifikat</small>' +
      '<strong>Certified Easter Egg Hunter</strong>' +
      '<span>christofferlilja.se · klarad ' + date + '</span>' +
      '<span class="ach-issuer">Utfärdare: Christoffer Lilja (och Claude)</span>' +
      '</div>' +
      '<details class="ach-hof"' + (openHof ? ' open' : '') + '>' +
      '<summary>🏅 Ta plats på topplistan</summary>' +
      '<p>Topplistan fylls på via pull requests. Skriv ditt GitHub-användarnamn, kopiera raden och lägg till den ' +
      'sist i <code>hall-of-fame.json</code> från det kontot.</p>' +
      '<label>GitHub-användarnamn <input type="text" autocomplete="username" spellcheck="false" placeholder="octocat" /></label>' +
      '<pre class="ach-hof-line" aria-live="polite"></pre>' +
      '<p class="ach-actions ach-hof-actions">' +
      '<button type="button" class="ach-copy" disabled>Kopiera raden</button>' +
      '<a href="' + HOF_EDIT_URL + '" target="_blank" rel="noopener">Öppna filen på GitHub</a>' +
      '</p>' +
      '<p class="ach-hof-note">GitHub forkar repot och skapar PR:en åt dig. CI kontrollerar att raden stämmer och att ' +
      'PR:en kommer från samma konto. En plats per konto, och det är ett ärlighetssystem. 😉</p>' +
      '</details>' +
      '<p class="ach-actions">' +
      '<a href="mailto:christoffer.lilja@gmail.com?subject=' + encodeURIComponent('Jag hittade alla påskägg!') +
      '&body=' + encodeURIComponent('Klarad ' + date + ' (epoch ' + completed + ')') + '">Berätta för mig</a>' +
      '<button type="button" class="ach-close">Stäng</button>' +
      '</p></div>';
    document.body.appendChild(o);

    var input = o.querySelector('.ach-hof input');
    var line = o.querySelector('.ach-hof-line');
    var copy = o.querySelector('.ach-copy');
    var render = function () {
      var handle = input.value.trim().replace(/^@/, '');
      if (!handle) { line.textContent = ''; copy.disabled = true; return; }
      if (!GITHUB_HANDLE.test(handle)) {
        line.textContent = 'Det där ser inte ut som ett GitHub-användarnamn.';
        copy.disabled = true;
        return;
      }
      hofId(handle, completed).then(function (id) {
        if (input.value.trim().replace(/^@/, '') !== handle) return; // hann skriva vidare
        line.textContent = '  { "github": "' + handle + '", "completed": ' + completed + ', "id": "' + id + '" }';
        copy.disabled = false;
      });
    };
    input.addEventListener('input', render);
    copy.addEventListener('click', function () {
      var text = line.textContent.trim();
      var done = function () { copy.textContent = 'Kopierad ✓'; setTimeout(function () { copy.textContent = 'Kopiera raden'; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
    });

    var close = function () { o.remove(); document.removeEventListener('keydown', onKey, true); };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey, true);
    o.querySelector('.ach-close').addEventListener('click', close);
    o.addEventListener('click', function (e) { if (e.target === o) close(); });
    // Som i Outlook: för musen över "Congratulations" så smäller det igen
    o.querySelector('.ach-congrats').addEventListener('mouseenter', function () { fireworks(2500); });
    // Fokus flyttas efter att tangenttrycket som öppnade dialogen är klart. Annars kan Enter
    // "trycka" på Stäng i samma tryck och dialogen stängs direkt.
    setTimeout(function () {
      var target = openHof ? o.querySelector('.ach-hof input') : o.querySelector('.ach-close');
      if (target) target.focus();
    }, 50);
  }

  window.Eggs = {
    unlock: unlock,
    reset: reset,
    celebrate: celebrate,
    all: function () { return EGGS.slice(); },
    found: function () { return found.slice(); },
    isFound: function (id) { return found.indexOf(id) !== -1; },
    completedAt: completedAt
  };

  document.addEventListener('DOMContentLoaded', function () {
    updateCounter();
    var counter = document.getElementById('egg-counter');
    if (counter) {
      counter.addEventListener('click', function () {
        // Alla hittade: öppna certifikatet (och topplistan). Annars listan i terminalen.
        if (found.length === EGGS.length) celebrate(true);
        else document.dispatchEvent(new CustomEvent('eggs:show'));
      });
    }
    var egg = document.body.dataset.egg;
    if (egg) unlock(egg);
  });
})();
