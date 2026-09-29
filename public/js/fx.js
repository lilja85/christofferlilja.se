// Effekter för sudo-påskäggen: fallande element, blåskärm, BIOS-omstart, Nedry, HAL, WarGames,
// fejk-vim och säkerhetskontrollen som låser sudo efter rm -rf.
// Allt exponeras på window.Fx och anropas från terminalen i site.js.
(function () {
  var root = document.documentElement;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function overlay(cls, html) {
    var o = document.createElement('div');
    o.className = 'fx-overlay ' + cls;
    if (html) o.innerHTML = html;
    document.body.appendChild(o);
    return o;
  }

  function session(key, value) {
    try {
      if (value === undefined) return sessionStorage.getItem(key);
      if (value === null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, value);
    } catch (e) {}
    return null;
  }

  // --- Gravitation: alla element faller ner och studsar --------------------
  function fall() {
    if (reducedMotion) return wait(300);
    var selectors = '.brand, .site-header nav > *, main h1, main h2, main p, main li, main img, main pre, .site-footer > *, .retro-marquee, .retro-construction';
    var picked = Array.prototype.slice.call(document.querySelectorAll(selectors));
    // Ta bara med de yttersta, så att t.ex. ett <p> inuti ett <li> inte faller för sig självt
    picked = picked.filter(function (el) {
      return !picked.some(function (other) { return other !== el && other.contains(el); });
    });
    var bodies = picked.map(function (el) {
      var r = el.getBoundingClientRect();
      return { el: el, x: r.left, y: r.top, w: r.width, h: r.height, vy: -Math.random() * 3, vx: (Math.random() - 0.5) * 2, rot: 0, vr: (Math.random() - 0.5) * 6 };
    }).filter(function (b) { return b.w > 0 && b.h > 0 && b.y < window.innerHeight; });

    bodies.forEach(function (b) {
      var s = b.el.style;
      s.position = 'fixed';
      s.left = b.x + 'px';
      s.top = b.y + 'px';
      s.width = b.w + 'px';
      s.margin = '0';
      s.zIndex = '40';
      s.transition = 'none';
    });
    document.body.style.overflow = 'hidden';

    return new Promise(function (resolve) {
      var start = performance.now();
      function step(now) {
        var floor = window.innerHeight;
        bodies.forEach(function (b, i) {
          if (now - start < i * 25) return; // lite förskjutning så att det rasar i vågor
          b.vy += 0.9;
          b.y += b.vy;
          b.x += b.vx;
          b.rot += b.vr;
          if (b.y + b.h > floor) {
            b.y = floor - b.h;
            b.vy *= -0.35;
            b.vr *= 0.6;
            b.vx *= 0.8;
          }
          b.el.style.transform = 'translate(' + (b.x - parseFloat(b.el.style.left)) + 'px,' + (b.y - parseFloat(b.el.style.top)) + 'px) rotate(' + b.rot + 'deg)';
        });
        if (now - start < 2800) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  // --- Blåskärm ------------------------------------------------------------
  function bsod(reason) {
    var qr = '';
    for (var i = 0; i < 100; i++) qr += '<i' + (Math.random() > 0.5 ? ' class="on"' : '') + '></i>';
    var o = overlay('fx-bsod',
      '<div class="fx-bsod-inner">' +
      '<div class="fx-bsod-face">:(</div>' +
      '<p>Din dator stötte på ett problem och måste startas om. Vi samlar bara in lite felinformation, och sedan startar vi om åt dig.</p>' +
      '<p class="fx-bsod-pct"><span>0</span>% klart</p>' +
      '<div class="fx-bsod-foot"><div class="fx-bsod-qr">' + qr + '</div><div>' +
      '<p>Mer information om problemet och möjliga lösningar finns på https://christofferlilja.se/lab/</p>' +
      '<p>Om du ringer en supporttekniker kan du ge dem den här informationen:<br>Stoppkod: CRITICAL_PROCESS_DIED<br>Vad som misslyckades: ' + reason + '</p>' +
      '</div></div></div>');
    var pct = o.querySelector('.fx-bsod-pct span');
    return new Promise(function (resolve) {
      var n = 0;
      var t = setInterval(function () {
        n = Math.min(100, n + Math.ceil(Math.random() * 12));
        pct.textContent = n;
        if (n >= 100) { clearInterval(t); setTimeout(function () { resolve(o); }, 700); }
      }, 280);
    });
  }

  // --- BIOS-start ----------------------------------------------------------
  function post(lines) {
    var o = overlay('fx-post', '<pre></pre>');
    var pre = o.querySelector('pre');
    var chain = wait(500);
    lines.forEach(function (line) {
      chain = chain.then(function () {
        pre.textContent += line + '\n';
        return wait(line === '' ? 150 : 380);
      });
    });
    return chain.then(function () { return wait(600); }).then(function () { return o; });
  }

  var BIOS = [
    'ChristofferOS BIOS v2026.09   (C) 1985–2026 Lilja Megatrends Inc.',
    '',
    'CPU: Hjärna @ 3 koppar kaffe',
    'Minnestest: 640K OK (ought to be enough for anybody)',
    'Hittade enhet: /dev/lab',
    'Hittade enhet: /dev/kaffebryggare ... inte redo'
  ];

  // Efter rm -rf: ladda om sidan (återställd från "backup") och lås sudo
  function crash(reason) {
    root.dataset.fx = 'busy';
    return fall()
      .then(function () { return bsod(reason); })
      .then(function (blue) {
        return post(BIOS.concat(['Återställer från backup ............ OK', 'Startar christofferlilja.se ...'])).then(function () { blue.remove(); });
      })
      .then(function () {
        session('sudo-locked', '1');
        session('after-crash', '1');
        location.reload();
      });
  }

  // IT Crowd-omstart: svart skärm, BIOS, tillbaka utan omladdning
  function reboot() {
    root.dataset.fx = 'busy';
    var black = overlay('fx-post', '<pre>Stänger av ...</pre>');
    return wait(1200)
      .then(function () { black.remove(); return post(BIOS.concat(['Startar christofferlilja.se ...'])); })
      .then(function (o) { o.remove(); delete root.dataset.fx; });
  }

  // --- Nedry: "Ah ah ah, you didn't say the magic word!" --------------------
  function nedry() {
    var o = overlay('fx-nedry', '<div class="fx-nedry-finger" aria-hidden="true">☝️</div><p>Ah ah ah!<br>Du sa inte det magiska ordet!</p>');
    return wait(3600).then(function () { o.remove(); });
  }

  // --- Säkerhetskontroll efter rm -rf ---------------------------------------
  function isLocked() { return session('sudo-locked') === '1'; }

  function lockout(onUnlock) {
    root.dataset.fx = 'busy';
    var o = overlay('fx-lock',
      '<div class="fx-lock-box" role="dialog" aria-modal="true" aria-labelledby="fx-lock-title">' +
      '<h2 id="fx-lock-title">🔒 Kontot är spärrat</h2>' +
      '<p class="fx-lock-intro">Misstänkt aktivitet upptäcktes (<code>rm -rf /*</code>). Klara säkerhetskontrollen för att få tillbaka sudo.</p>' +
      '<div class="fx-lock-step"></div>' +
      '<p class="fx-lock-progress"></p>' +
      '<button type="button" class="fx-lock-close">Avbryt (du förblir spärrad)</button>' +
      '</div>');
    var stepEl = o.querySelector('.fx-lock-step');
    var progress = o.querySelector('.fx-lock-progress');

    function close() {
      o.remove();
      delete root.dataset.fx;
      document.removeEventListener('keydown', onEsc, true);
    }
    function onEsc(e) {
      if (e.key === 'Escape' && !document.querySelector('.fx-vim')) close();
    }
    document.addEventListener('keydown', onEsc, true);
    o.querySelector('.fx-lock-close').addEventListener('click', close);

    var steps = [robotStep, tabsStep, vimStep, approvalStep];
    var i = 0;
    function next() {
      if (i >= steps.length) {
        session('sudo-locked', null);
        stepEl.innerHTML = '<p class="fx-ok">✅ Säkerhetskontrollen är godkänd. sudo är tillgängligt igen.</p>';
        progress.textContent = '';
        setTimeout(function () { close(); if (onUnlock) onUnlock(); }, 1800);
        return;
      }
      progress.textContent = 'Steg ' + (i + 1) + ' av ' + steps.length;
      steps[i++](stepEl, next);
    }
    next();
  }

  function robotStep(el, done) {
    el.innerHTML =
      '<p><strong>Bevisa att du inte är en robot.</strong><br>Vad blir <code>0.1 + 0.2</code> i JavaScript?</p>' +
      '<form class="fx-row"><input type="text" inputmode="decimal" autocomplete="off" aria-label="Svar" /><button type="submit">Svara</button></form>' +
      '<p class="fx-msg" aria-live="polite"></p>';
    var input = el.querySelector('input');
    var msg = el.querySelector('.fx-msg');
    var tries = 0;
    input.focus();
    el.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim().replace(',', '.');
      if (!v) return; // t.ex. Enter-trycket från terminalen som öppnade kontrollen
      if (v === String(0.1 + 0.2)) { done(); return; }
      tries++;
      if (v === '0.3') msg.textContent = 'Fel. Så där svarar en människa. En robot hade vetat bättre. Eller... vänta.';
      else msg.textContent = 'Fel. Försök igen.';
      if (tries >= 2) msg.textContent += ' Tips: öppna konsolen (F12) och fråga JavaScript själv.';
    });
  }

  function tabsStep(el, done) {
    el.innerHTML =
      '<p><strong>Kontrollfråga:</strong> Tabs eller spaces?</p>' +
      '<div class="fx-row"><button type="button" data-a="tabs">Tabs</button><button type="button" data-a="spaces">Spaces</button></div>' +
      '<p class="fx-msg" aria-live="polite"></p>';
    var msg = el.querySelector('.fx-msg');
    var wrong = {};
    el.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.a === 'editorconfig') { done(); return; }
        wrong[b.dataset.a] = true;
        b.disabled = true;
        msg.textContent = b.dataset.a === 'tabs' ? 'Fel. Halva teamet har redan lämnat mötet.' : 'Fel. Nu har den andra halvan också gått.';
        if (wrong.tabs && wrong.spaces) {
          var ok = document.createElement('button');
          ok.type = 'button';
          ok.dataset.a = 'editorconfig';
          ok.textContent = 'Det som står i .editorconfig';
          ok.addEventListener('click', done);
          el.querySelector('.fx-row').appendChild(ok);
          ok.focus();
        }
      });
    });
  }

  function vimStep(el, done) {
    el.innerHTML =
      '<p><strong>Avsluta vim för att fortsätta.</strong><br>Lycka till.</p>' +
      '<div class="fx-row"><button type="button">Öppna vim</button></div>';
    var btn = el.querySelector('button');
    btn.focus();
    btn.addEventListener('click', function () { vim(done); });
  }

  function approvalStep(el, done) {
    el.innerHTML =
      '<p><strong>Din åtkomstbegäran väntar på godkännande.</strong><br>Uppskattad väntetid: 3–5 arbetsdagar.</p>' +
      '<div class="fx-row"><button type="button" class="remind">Påminn approver</button></div>' +
      '<p class="fx-msg" aria-live="polite"></p>';
    var msg = el.querySelector('.fx-msg');
    var remind = el.querySelector('.remind');
    remind.focus();
    remind.addEventListener('click', function () {
      remind.disabled = true;
      msg.textContent = 'Autosvar: "Jag är på semester till vecka 34 och läser inte mejl."';
      var esc = document.createElement('button');
      esc.type = 'button';
      esc.textContent = 'Eskalera till chefen';
      esc.addEventListener('click', function () {
        esc.disabled = true;
        msg.textContent = 'Skickar till chefen ...';
        setTimeout(function () {
          msg.textContent = 'Godkänd av chefen (utan att läsa motiveringen). Precis som vanligt. ✅';
          setTimeout(done, 4500);
        }, 1400);
      });
      el.querySelector('.fx-row').appendChild(esc);
      esc.focus();
    });
  }

  // --- Fejk-vim: bara :q! (och :qa!) tar dig ut -----------------------------
  function vim(onExit) {
    var tildes = '';
    for (var i = 0; i < 40; i++) tildes += '<div class="fx-vim-tilde">~</div>';
    var o = overlay('fx-vim',
      '<div class="fx-vim-buf">' +
      '<div># Välkommen till vim.</div><div># Den här filen är skrivskyddad. Precis som din sudo-behörighet.</div>' +
      tildes + '</div>' +
      '<div class="fx-vim-status"><span>"sudoers" [skrivskyddad] 2L, 74B</span><span>1,1  Allt</span></div>' +
      '<div class="fx-vim-cmd"></div>' +
      '<input class="fx-vim-input" aria-label="vim" autocomplete="off" autocapitalize="off" spellcheck="false" />');
    var cmdEl = o.querySelector('.fx-vim-cmd');
    var input = o.querySelector('.fx-vim-input');
    var cmd = null;
    input.focus();
    o.addEventListener('click', function () { input.focus(); });

    function show(text, err) {
      cmdEl.textContent = text;
      cmdEl.classList.toggle('err', !!err);
    }

    input.addEventListener('keydown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        cmd = null;
        show('Type  :qa!  and press <Enter> to abandon all changes and exit Vim');
        return;
      }
      if (cmd === null) {
        if (e.key === ':') { cmd = ''; show(':'); }
        else if (e.key === 'Escape') show('');
        else if (e.key === 'i') show('-- INSERT -- (nej, du får inte skriva här)', true);
        return;
      }
      if (e.key === 'Escape') { cmd = null; show(''); return; }
      if (e.key === 'Backspace') {
        if (cmd === '') { cmd = null; show(''); return; }
        cmd = cmd.slice(0, -1); show(':' + cmd); return;
      }
      if (e.key === 'Enter') {
        var c = cmd.trim();
        cmd = null;
        if (c === 'q!' || c === 'qa!' || c === 'wq!' || c === 'x!' || c === 'wqa!' || c === 'xa!') { o.remove(); if (window.Eggs) window.Eggs.unlock('vim'); onExit(); return; }
        if (c === 'q' || c === 'qa') show('E37: No write since last change (add ! to override)', true);
        else if (c === 'wq' || c === 'x' || c === 'w') show("E45: 'readonly' option is set (add ! to override)", true);
        else if (c === 'help') show('Hjälp? I vim? Det finns ingen hjälp här. Bara :q! 😇', true);
        else show('E492: Not an editor command: ' + c, true);
        return;
      }
      if (e.key.length === 1) { cmd += e.key; show(':' + cmd); }
    });
  }

  // --- Merge-konflikt: sidan delas diagonalt mellan två teman -----------------
  // Den inkommande versionen är en klon av sidan i det andra temat, klippt till en triangel.
  var THEME_NAMES = { light: 'light', dark: 'dark', gray: 'gray' };

  // Bygger en kopia av sidan i ett annat tema, helt frikopplad innan den läggs in i DOM:en.
  // Webbkomponenter (t.ex. Astros dev-verktygsfält) tas bort, eftersom de startar om
  // när de ansluts till sidan och inte tål att klonas.
  function isCustomElement(el) {
    return el.tagName.indexOf('-') !== -1;
  }
  function cloneInTheme(theme, scrollY) {
    var other = document.createElement('div');
    other.className = 'fx-conflict-other fx-scope-' + theme;
    var inner = document.createElement('div');
    inner.className = 'fx-conflict-inner';
    Array.prototype.forEach.call(document.body.children, function (child) {
      if (isCustomElement(child) || child.matches('script, .term, .toast, .fx-overlay')) return;
      inner.appendChild(child.cloneNode(true));
    });
    Array.prototype.forEach.call(inner.querySelectorAll('*'), function (e) {
      if (isCustomElement(e) || e.tagName === 'SCRIPT') e.remove();
      else e.removeAttribute('id');
    });
    inner.setAttribute('aria-hidden', 'true');
    inner.style.transform = 'translateY(' + -scrollY + 'px)';
    other.appendChild(inner);
    return other;
  }

  function conflict(opts, onResolve) {
    root.dataset.fx = 'busy';
    var scrollY = window.scrollY;
    var o = overlay('fx-conflict');

    // Klonen är bara dekoration. Går den inte att bygga visas konflikten ändå, utan delad vy.
    try {
      o.appendChild(cloneInTheme(opts.incoming, scrollY));
    } catch (e) {
      console.warn('Merge-konflikt: kunde inte klona sidan', e);
    }

    var angle = -Math.atan2(window.innerHeight, window.innerWidth) * 180 / Math.PI;
    o.insertAdjacentHTML('beforeend',
      '<svg class="fx-conflict-seam" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
      '<line x1="100" y1="0" x2="0" y2="100" vector-effect="non-scaling-stroke" /></svg>' +
      '<div class="fx-conflict-mid" style="transform: translate(-50%, -50%) rotate(' + angle + 'deg)">=======</div>' +
      '<div class="fx-conflict-marker fx-conflict-current">&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD (den här fliken: ' + THEME_NAMES[opts.current] + ')</div>' +
      '<div class="fx-conflict-marker fx-conflict-incoming">&gt;&gt;&gt;&gt;&gt;&gt;&gt; ' + opts.incomingLabel + ' (' + THEME_NAMES[opts.incoming] + ')</div>' +
      '<div class="fx-conflict-bar" role="dialog" aria-modal="true" aria-label="Merge-konflikt i temat">' +
      '<strong>CONFLICT (content): Merge conflict in theme</strong>' +
      '<div class="fx-conflict-lens">' +
      '<button type="button" data-c="current">Accept Current Change</button> | ' +
      '<button type="button" data-c="incoming">Accept Incoming Change</button> | ' +
      '<button type="button" data-c="both">Accept Both Changes</button> | ' +
      '<button type="button" data-c="compare">Compare Changes</button>' +
      '</div><p class="fx-conflict-msg" aria-live="polite"></p></div>');

    var msg = o.querySelector('.fx-conflict-msg');
    document.body.style.overflow = 'hidden';
    o.querySelector('.fx-conflict-lens button').focus();

    o.querySelectorAll('.fx-conflict-lens button').forEach(function (b) {
      b.addEventListener('click', function () {
        var c = b.dataset.c;
        if (c === 'compare') {
          msg.textContent = 'diff --git a/theme b/theme\n-' + opts.current + '\n+' + opts.incoming + '\nEn rad. Det är hela skillnaden. Ingen av er har rätt.';
          return;
        }
        o.remove();
        document.body.style.overflow = '';
        delete root.dataset.fx;
        onResolve(c);
      });
    });
  }

  // Efter omladdningen från en krasch
  function afterLoad(log) {
    if (session('after-crash') === '1') {
      session('after-crash', null);
      setTimeout(function () {
        log('[BACKUP] Systemet återställt från backup. Tur att någon tog backup! 💾');
        log('[AUDIT] Incidenten rm -rf /* har rapporterats. sudo är spärrat tills vidare.');
      }, 400);
    }
  }

  window.Fx = {
    wait: wait,
    crash: crash,
    reboot: reboot,
    nedry: nedry,
    isLocked: isLocked,
    lockout: lockout,
    vim: vim,
    conflict: conflict,
    afterLoad: afterLoad
  };
})();
