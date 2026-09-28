(function () {
  var root = document.documentElement;

  // --- Temaväxlare --------------------------------------------------------
  var toggle = document.getElementById('theme-toggle');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    var t = root.dataset.theme;
    if (t === 'light' || t === 'dark' || t === 'gray') return t;
    return darkQuery.matches ? 'dark' : 'light';
  }

  // Temat delas mellan flikar via localStorage. theme-meta berättar vem som skrev och när,
  // så att en flik kan upptäcka en samtidig ändring i en annan flik (se storage-lyssnaren nedan).
  var tabId = Math.random().toString(36).slice(2);
  var lastLocalChange = 0;

  // opts.remote: ändringen kom från en annan flik och ska inte skrivas tillbaka
  // opts.resolved: skrivs som resultat av en löst konflikt och ska inte trigga nya konflikter
  function setTheme(theme, opts) {
    opts = opts || {};
    root.dataset.theme = theme;
    if (!opts.remote) {
      lastLocalChange = Date.now();
      try {
        localStorage.setItem('theme-meta', JSON.stringify({ tab: tabId, t: lastLocalChange, resolved: !!opts.resolved }));
        localStorage.setItem('theme', theme);
      } catch (e) {}
    }
    updateLabel();
    document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  }
  function updateLabel() {
    if (!toggle) return;
    var label = root.classList.contains('sudo')
      ? 'Avsluta sudo och lämna tillbaka behörigheten'
      : rateLimited() ? 'Rate limited. Försök igen om ' + toggle.dataset.retry + ' s'
      : currentTheme() === 'dark' ? 'Byt till ljust tema' : 'Byt till mörkt tema';
    toggle.setAttribute('aria-label', label);
    toggle.title = root.classList.contains('sudo') ? 'Lås igen (avsluta sudo)' : 'Byt tema';
  }

  // --- Påskägg: rate limiting på temaknappen ------------------------------
  // Max 3 byten per 10 s. Den som ignorerar Retry-After trappas upp till WAF och sedan Sentinel.
  // (Det är också god tillgänglighet: WCAG 2.3.1 säger högst tre blinkningar per sekund.)
  var RATE_LIMIT = 3;
  var RATE_WINDOW = 10000;
  var flips = [];
  var blockedUntil = 0;
  var strikes = 0;
  var retryTimer;

  function rateLimited() {
    return Date.now() < blockedUntil;
  }
  function block(seconds) {
    blockedUntil = Date.now() + seconds * 1000;
    toggle.classList.add('rate-limited');
    clearInterval(retryTimer);
    function update() {
      var left = Math.ceil((blockedUntil - Date.now()) / 1000);
      if (left > 0) {
        toggle.dataset.retry = left;
        updateLabel();
        return;
      }
      clearInterval(retryTimer);
      toggle.classList.remove('rate-limited');
      delete toggle.dataset.retry;
      flips = [];
      strikes = 0;
      updateLabel();
      toast('Rate limit återställd. Byt tema med måtta. 🙂');
      auditLog('[RATE LIMIT] Kvoten återställd. Klienten är släppt.');
    }
    update();
    retryTimer = setInterval(update, 250);
  }
  function onBlockedClick() {
    strikes++;
    if (strikes === 3) {
      block(20);
      toast('[WAF] OWASP CRS-regel 912120 utlöst: misstänkt DoS-attack mot temaknappen.\nKlienten övervakas. Retry-After förlängd till 20 s.', 6000);
      auditLog('[WAF] Regel 912120 (Denial of Service) utlöst av temaknappen. Retry-After: 20');
    } else if (strikes === 6) {
      block(30);
      toast('[SENTINEL] Incident #4711 skapad.\nAllvarlighetsgrad: Låg · MITRE ATT&CK T1499 Endpoint Denial of Service (mot dina ögon)\nTilldelad: Christoffer · Retry-After: 30 s', 8000);
      auditLog('[SENTINEL] Incident #4711: upprepade temabyten trots 429. Taktik: T1499 Endpoint DoS. Tilldelad: Christoffer.');
    } else {
      var left = toggle.dataset.retry;
      toast(strikes < 3
        ? '429 Too Many Requests. Retry-After: ' + left + ' s. Läs headern! 😉'
        : '429 igen. Klienter som ignorerar Retry-After brukar hamna i en logg. Retry-After: ' + left + ' s', 3500);
    }
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      // I sudo-läget är knappen ett hänglås som avslutar förhöjningen
      if (root.classList.contains('sudo')) { expireSudo('button'); return; }
      if (rateLimited()) { onBlockedClick(); return; }

      var now = Date.now();
      flips = flips.filter(function (t) { return now - t < RATE_WINDOW; });
      if (flips.length >= RATE_LIMIT) {
        block(10);
        toast('429 Too Many Requests · Retry-After: 10 s\nTemabyten är begränsade till ' + RATE_LIMIT + ' per 10 sekunder för att skydda mot brute force-attacker mot mörkerseendet. (Och ja, WCAG 2.3.1 håller med.)', 7000);
        auditLog('[RATE LIMIT] 429 Too Many Requests: fler än ' + RATE_LIMIT + ' temabyten på 10 s. Retry-After: 10');
        return;
      }
      flips.push(now);

      // Från 2008-läget går knappen tillbaka till nutiden
      if (root.dataset.theme === '2008') setTheme(darkQuery.matches ? 'dark' : 'light');
      else setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
    darkQuery.addEventListener('change', updateLabel);
    updateLabel();
  }

  // --- Påskägg: merge-konflikt när två flikar ändrar temat samtidigt ----------
  var CONFLICT_WINDOW = 30000;
  function conflictable(t) {
    return t === 'light' || t === 'dark' || t === 'gray';
  }
  function mergeConflict(current, incoming, incomingLabel) {
    return new Promise(function (resolve) {
      window.Fx.conflict({ current: current, incoming: incoming, incomingLabel: incomingLabel }, function (choice) {
        if (choice === 'current') {
          setTheme(current, { resolved: true });
          toast('Konflikten löst: din ändring vann. Den andra sidan får leva med det.');
        } else if (choice === 'incoming') {
          setTheme(incoming, { resolved: true });
          toast('Konflikten löst: du accepterade den inkommande ändringen. Väldigt diplomatiskt.');
        } else {
          setTheme('gray', { resolved: true });
          toast('Accept Both: ljust + mörkt = grått. Ingen blev nöjd. Precis som en riktig kompromiss.', 6000);
        }
        auditLog('[GIT] Merge-konflikt i theme löst (' + choice + '). Commit: "fix: resolve theme conflict"');
        resolve();
      });
    });
  }
  window.addEventListener('storage', function (e) {
    if (e.key !== 'theme' || !e.newValue) return;
    var meta = {};
    try { meta = JSON.parse(localStorage.getItem('theme-meta') || '{}'); } catch (err) {}
    var mine = root.dataset.theme === '2008' ? '2008' : currentTheme();
    if (e.newValue === mine) return;
    var recent = Date.now() - lastLocalChange < CONFLICT_WINDOW;
    if (recent && !meta.resolved && !root.dataset.fx && window.Fx && conflictable(mine) && conflictable(e.newValue)) {
      mergeConflict(mine, e.newValue, 'annan flik');
    } else {
      setTheme(e.newValue, { remote: true });
    }
  });

  // --- Toast --------------------------------------------------------------
  var toastEl = document.getElementById('toast');
  var toastTimer;
  function toast(text, ms) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, ms || 4000);
  }

  // --- Logg: skriver både till webbläsarens konsol och den hemliga terminalen ---
  var LOG_STYLE = 'color:#39ff6a;background:#020703;font-family:monospace;padding:2px 4px';
  function auditLog(text) {
    var stamp = new Date().toLocaleTimeString('sv-SE');
    console.log('%c' + stamp + ' ' + text, LOG_STYLE);
    term.print(stamp + ' ' + text, 'log');
  }

  // --- Påskägg: sudo-läge (Konami-koden, "sudo" eller terminalen) -------------
  // Tidsbegränsad förhöjd behörighet, som Entra ID PIM. Stående behörigheter är ju inget att ha.
  var SUDO_SECONDS = 60;
  var sudoTimer, sudoTick;
  function stripTitle() {
    document.title = document.title.replace(/^\[sudo \d+s\] /, '');
  }
  function sudo() {
    if (window.Fx && window.Fx.isLocked()) {
      toast('besökare finns inte i sudoers-filen. Den här incidenten kommer att rapporteras. 🚨');
      auditLog('[AUDIT] Nekad sudo-förfrågan: kontot är spärrat. Öppna terminalen (".") och kör sudo.');
      return;
    }
    if (root.classList.contains('sudo')) {
      toast('sudo: du har redan förhöjd behörighet. Least privilege, tack.');
      term.print('sudo: du har redan förhöjd behörighet. Least privilege, tack.');
      return;
    }
    root.classList.add('sudo');
    updateLabel();
    var left = SUDO_SECONDS;
    toast('[PIM] Rollen "Global Nörd" aktiverad i ' + left + ' s. Motivering: "ville bara testa".', 5000);
    auditLog('[PIM] Aktivering godkänd: rollen "Global Nörd" i ' + SUDO_SECONDS + ' s. Loggad för granskning.');
    sudoTick = setInterval(function () {
      left--;
      stripTitle();
      if (left > 0) document.title = '[sudo ' + left + 's] ' + document.title;
    }, 1000);
    sudoTimer = setTimeout(expireSudo, SUDO_SECONDS * 1000);
  }
  // reason: undefined = tiden löpte ut, true = sudo -k, 'button' = hänglåsknappen
  function expireSudo(reason) {
    clearInterval(sudoTick);
    clearTimeout(sudoTimer);
    root.classList.remove('sudo');
    stripTitle();
    updateLabel();
    if (reason === 'button') {
      toast('Tack för att du minskar dina behörigheter! Least privilege när det är som bäst. 🔒🙏', 5000);
      auditLog('[PIM] Rollen "Global Nörd" lämnades tillbaka frivilligt. Säkerhetsteamet tackar. 🙏');
      return;
    }
    var msg = reason
      ? '[PIM] Aktiveringen avslutades i förtid. Behörigheten är återkallad.'
      : '[PIM] Aktiveringen har löpt ut. Behörigheten är återkallad.';
    toast(msg + ' 🔒');
    auditLog(msg);
  }

  // --- Påskägg: hemlig terminal ("." eller tangenten under Esc) -------------
  // "." är en blinkning till GitHub. Tangenten under Esc (§ på svenskt tangentbord,
  // ` på amerikanskt) är den klassiska Quake-konsolen.
  var labPosts = [];
  try {
    var dataEl = document.getElementById('lab-data');
    if (dataEl) labPosts = JSON.parse(dataEl.textContent || '[]');
  } catch (e) {}

  var Fx = window.Fx;
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var term = (function () {
    // Förifylld historik från "förra besökaren": ledtrådar till påskägg som inte står i help
    var PREVIOUS_VISITOR = ['make me a sandwich', 'git status', 'git remote -v', 'theme 2008', 'rm -rf /'];
    var history = PREVIOUS_VISITOR.slice();
    var el, out, input, histPos = history.length, buffer = [], busy = false;

    function build() {
      el = document.createElement('div');
      el.className = 'term';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Terminal');
      el.hidden = true;
      el.innerHTML =
        '<div class="term-bar"><span>besokare@christofferlilja.se: ~</span>' +
        '<button type="button" class="term-close" aria-label="Stäng terminalen">×</button></div>' +
        '<div class="term-out" aria-live="polite"></div>' +
        '<label class="term-line"><span class="term-prompt">$</span>' +
        '<input class="term-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Kommando" /></label>';
      document.body.appendChild(el);
      out = el.querySelector('.term-out');
      input = el.querySelector('.term-input');
      el.querySelector('.term-close').addEventListener('click', close);
      el.addEventListener('click', function (e) { if (e.target === el || e.target === out) input.focus(); });
      input.addEventListener('keydown', onKey);
      print('christofferlilja.se terminal. Skriv "help" för att se kommandon, Esc för att stänga.', 'dim');
      buffer.forEach(function (b) { b(); });
      buffer = [];
    }

    function append(node) {
      out.appendChild(node);
      out.scrollTop = out.scrollHeight;
    }

    function print(text, cls) {
      if (!out) { buffer.push(function () { print(text, cls); }); return; }
      var line = document.createElement('div');
      if (cls) line.className = 'term-' + cls;
      line.textContent = text;
      append(line);
    }

    function printLink(label, href) {
      var line = document.createElement('div');
      var a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      line.appendChild(a);
      append(line);
    }

    // Skriver rader en i taget, för dramatisk effekt
    function type(lines, delay, cls) {
      var chain = Promise.resolve();
      lines.forEach(function (l) {
        chain = chain.then(function () { print(l, cls); return wait(delay); });
      });
      return chain;
    }

    function open() {
      if (!el) build();
      el.hidden = false;
      input.focus();
    }
    function close() {
      if (el) el.hidden = true;
    }

    function setBusy(b) {
      busy = b;
      if (input) input.disabled = b;
      if (!b && input && !el.hidden) input.focus();
    }

    function onKey(e) {
      if (busy) return;
      if (e.key === 'Enter') {
        var cmd = input.value;
        input.value = '';
        if (cmd.trim()) history.push(cmd.trim());
        histPos = history.length;
        print('$ ' + cmd, 'cmd');
        var result = run(cmd.trim());
        if (result && typeof result.then === 'function') {
          setBusy(true);
          result.then(function () { setBusy(false); }, function () { setBusy(false); });
        }
      } else if (e.key === 'ArrowUp') {
        if (histPos > 0) { histPos--; input.value = history[histPos]; }
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        if (histPos < history.length) { histPos++; input.value = history[histPos] || ''; }
        e.preventDefault();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        var matches = Object.keys(commands).filter(function (c) { return c.indexOf(input.value) === 0; });
        if (matches.length === 1) input.value = matches[0] + ' ';
        else if (matches.length > 1) print(matches.join('  '), 'dim');
      } else if (e.key === 'Escape') {
        close();
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        out.textContent = '';
      }
    }

    function isDangerousRm(args) {
      var flags = args.filter(function (a) { return a.charAt(0) === '-'; }).join('');
      return /r/.test(flags) && /f/.test(flags);
    }

    // Jurassic Park: Dennis Nedry viftar med fingret
    function nedry() {
      var lines = [];
      for (var i = 0; i < 6; i++) lines.push('Ah ah ah! Du sa inte det magiska ordet!');
      return Promise.all([type(lines, 450, 'err'), Fx.nedry()]).then(function () {
        print('(psst: det magiska ordet börjar på "su" och slutar på "do")', 'dim');
      });
    }

    function denied(name) {
      print(name + ': behörighet saknas', 'err');
      return nedry();
    }

    // --- Kommandon som kräver sudo --------------------------------------
    var sudoCommands = {
      rm: function (args) {
        if (!isDangerousRm(args)) {
          print(args.length ? 'rm: kan inte ta bort \'' + args[args.length - 1] + '\': Filen eller katalogen finns inte' : 'rm: operand saknas', 'err');
          return;
        }
        var targets = args.filter(function (a) { return a.charAt(0) !== '-'; });
        var noPreserve = args.indexOf('--no-preserve-root') !== -1;
        if (targets.indexOf('/*') !== -1 || (targets.indexOf('/') !== -1 && noPreserve)) return chaos();
        if (targets.indexOf('/') !== -1) {
          print('rm: det är farligt att arbeta rekursivt på \'/\'', 'err');
          print('rm: använd --no-preserve-root för att gå förbi det här skyddet', 'err');
          return;
        }
        print('rm: kan inte ta bort \'' + (targets[0] || '') + '\': Filen eller katalogen finns inte', 'err');
      },
      make: function (args) {
        if (args.join(' ').toLowerCase() === 'me a sandwich') {
          print('Okay.');
          print('🥪');
          print('(xkcd #149)', 'dim');
          return;
        }
        print('make: *** Ingen regel för att skapa målet \'' + (args[0] || '') + '\'.  Stopp.', 'err');
      },
      shutdown: function () {
        var eye = document.createElement('div');
        eye.className = 'term-hal';
        eye.setAttribute('aria-hidden', 'true');
        append(eye);
        return wait(1200)
          .then(function () { return type(['I\'m sorry, Dave. I\'m afraid I can\'t do that.'], 1600, 'haltext'); })
          .then(function () { return type(['Den här webbsidan är för viktig för att jag ska låta dig äventyra den.'], 400, 'haltext'); });
      },
      reboot: function () {
        return type(['📞 Hello, IT.', 'Have you tried turning it off and on again?', 'Okej, jag gör det åt dig ...'], 1100)
          .then(function () {
            close();
            return Fx.reboot();
          })
          .then(function () {
            open();
            auditLog('[SYSTEM] Omstart klar. Fungerar det nu? 👍');
          });
      },
      launch: function () {
        return type([
          'GREETINGS PROFESSOR FALKEN.',
          '',
          'SHALL WE PLAY A GAME?',
          '',
          '  TIC-TAC-TOE',
          '  SCHACK',
          '  GLOBAL THERMONUCLEAR WAR',
          '',
          '> GLOBAL THERMONUCLEAR WAR'
        ], 550, 'wopr')
          .then(function () {
            var sims = [];
            for (var i = 0; i < 8; i++) sims.push('SIMULERING ' + (i + 1) + ' ... VINNARE: INGEN');
            return type(sims, 180, 'wopr');
          })
          .then(function () {
            return type(['', 'A STRANGE GAME.', 'THE ONLY WINNING MOVE IS NOT TO PLAY.', '', 'HOW ABOUT A NICE GAME OF CHESS?'], 900, 'wopr');
          });
      },
      hire: function (args) {
        if ((args[0] || '').toLowerCase() !== 'christoffer') {
          print('hire: vem? Prova "sudo hire christoffer".', 'err');
          return;
        }
        print('Utmärkt val! 🎉 Så här når du mig:');
        printLink('→ LinkedIn', 'https://www.linkedin.com/in/lilja85/');
        printLink('→ christoffer.lilja@gmail.com', 'mailto:christoffer.lilja@gmail.com');
      },
      vim: function () {
        return commands.vim();
      }
    };

    // rm -rf /* med sudo: terminalen rasslar, sidan rasar, blåskärm, omstart
    function chaos() {
      var files = ['/lab/homelab-del-1-proxmox-pihole', '/assets/profil-avatar.jpg', '/etc/humor', '/etc/sudoers',
        '/home/christoffer/cv.pdf', '/usr/share/kaffe', '/var/log/påskägg.log', '/js/site.js', '/css/retro.css',
        '/boot/vmlinuz', '/bin/bash', '/dev/null (hur?)', '/.well-known/security.txt', '/humans.txt', '/index.html'];
      var lines = files.map(function (f) { return 'removed \'' + f + '\''; });
      return type(lines, 110, 'err')
        .then(function () { return wait(500); })
        .then(function () {
          close();
          return Fx.crash('rm -rf /*');
        });
    }

    function sudoCmd(args) {
      var first = args[0];

      if (first === '-k') {
        if (root.classList.contains('sudo')) expireSudo(true);
        else print('Ingen aktiv förhöjning att återkalla.', 'dim');
        return;
      }
      if (first === '-h' || first === '--help') {
        print('användning: sudo -h | -k | -l');
        print('            sudo [kommando]');
        print('Prova "sudo -l" för att se vad du får köra.', 'dim');
        return;
      }
      if (first === 'help') {
        print('sudo: help: kommandot hittades inte. Menade du "sudo -l"?', 'err');
        return;
      }
      if (first === '!!') {
        var prev = history[history.length - 2];
        if (!prev) { print('sudo: !!: inget tidigare kommando', 'err'); return; }
        var prevArgs = prev.split(/\s+/);
        if (prevArgs[0] === 'sudo') prevArgs.shift();
        print('sudo ' + prevArgs.join(' '), 'dim');
        return sudoCmd(prevArgs);
      }

      if (Fx.isLocked()) {
        print('besökare finns inte i sudoers-filen. Den här incidenten kommer att rapporteras.', 'err');
        close();
        Fx.lockout(function () {
          open();
          auditLog('[PIM] Säkerhetskontrollen godkänd. besökare är tillbaka i sudoers.');
        });
        return;
      }

      if (first === '-l') {
        [
          'Matchande standardposter för besökare på christofferlilja:',
          '    lecture=always, insults, pim_timeout=60s',
          '',
          'Användaren besökare får köra följande kommandon på christofferlilja:',
          '    (root) NOPASSWD: /usr/bin/make me a sandwich',
          '    (root) NOPASSWD: /usr/bin/hire christoffer',
          '    (root) /sbin/shutdown, /sbin/reboot',
          '    (root) /usr/local/bin/launch',
          '    (root) /usr/bin/vim',
          '    (root) /bin/rm -rf /*        # rekommenderas verkligen inte',
          '    (root) !!                    # kör om senaste kommandot med sudo',
          '    (root) -k                    # avsluta förhöjd behörighet'
        ].forEach(function (l) { print(l); });
        return;
      }
      if (!first) { sudo(); return; }

      var fn = sudoCommands[first.toLowerCase()];
      if (fn) return fn(args.slice(1));
      print('sudo: ' + first + ': kommandot hittades inte', 'err');
    }

    var commands = {
      help: function () {
        print('Tillgängliga kommandon:');
        print('  whoami        vem är jag?');
        print('  ls [lab]      lista innehåll');
        print('  cat <fil>     visa en fil (prova about.txt)');
        print('  open <mål>    linkedin, lab, security, humans, preview, production');
        print('  theme <val>   light | dark | 2008');
        print('  sudo [-k|-l]  tidsbegränsad förhöjd behörighet (-l visar vad du får göra)');
        print('  git <kmd>     status | pull | merge <light|dark> | push | blame | remote -v');
        print('  history, date, uname, vim, clear, exit');
      },
      whoami: function () {
        print('besökare. Men sidan handlar om christoffer, DevSecOps-konsult och lösningsarkitekt i Jönköping.');
        print('Grupper: besökare, nyfikna' + (root.classList.contains('sudo') ? ', root (tillfälligt)' : ''));
      },
      ls: function (args) {
        if (args[0] === 'lab' || args[0] === 'lab/') {
          if (!labPosts.length) { print('(tomt, men det kommer)', 'dim'); return; }
          labPosts.forEach(function (p) { printLink(p.date + '  ' + p.title, p.url); });
          return;
        }
        if (args.some(function (a) { return /^-[a-z]*a/.test(a); })) {
          print('.  ..  .bash_history  .secrets  .well-known/  about.txt  humans.txt  lab/');
          return;
        }
        print('about.txt  humans.txt  lab/');
      },
      cat: function (args) {
        var f = args[0] || '';
        if (f === 'about.txt') {
          print('Utvecklare sedan 2007, numera mest säkerhet i leveranskedjan:');
          print('Azure DevOps, GitHub Advanced Security, Terraform, Entra ID och IAM/IGA.');
          print('Bygger hellre lösningar som teamen vill använda än regler de måste följa.');
        } else if (f === '.bash_history') {
          print('# förra besökarens historik. Vad höll hen på med?', 'dim');
          PREVIOUS_VISITOR.forEach(function (h) { print(h); });
          print('# varför blinkar temaknappen så konstigt när jag klickar snabbt?', 'dim');
          print('# och varför blev det en merge-konflikt när jag hade två flikar öppna?', 'dim');
        } else if (f === '.secrets') {
          print('cat: .secrets: Åtkomst nekad. Snyggt försök, dock. 😉', 'err');
        } else if (f === 'humans.txt' || f === '.well-known/security.txt') {
          printLink('→ /' + f, '/' + f);
        } else if (!f) {
          print('cat: vilken fil? Prova "ls".', 'err');
        } else {
          print('cat: ' + f + ': Filen eller katalogen finns inte', 'err');
        }
      },
      open: function (args) {
        var targets = {
          linkedin: 'https://www.linkedin.com/in/lilja85/',
          preview: 'https://christofferlilja-se.pages.dev/',
          production: 'https://christofferlilja.se/',
          lab: '/lab/',
          security: '/.well-known/security.txt',
          humans: '/humans.txt'
        };
        var href = targets[args[0]];
        if (!href) { print('open: okänt mål. Prova: ' + Object.keys(targets).join(', '), 'err'); return; }
        print('Öppnar ' + href + ' ...', 'dim');
        window.location.href = href;
      },
      theme: function (args) {
        if (args[0] === 'light' || args[0] === 'dark') { setTheme(args[0]); print('Tema: ' + args[0]); }
        else if (args[0] === '2008') { setTheme('2008'); print('Spolar tillbaka till 2008 ... Kom ihåg att ringa upp modemet. 📞', 'log'); }
        else print('Användning: theme light | dark | 2008', 'err');
      },
      sudo: sudoCmd,
      git: function (args) {
        var sub = args[0] || '';
        var current = root.dataset.theme === '2008' ? '2008' : currentTheme();
        if (sub === 'status') {
          print('On branch main');
          print("Your branch is up to date with 'origin/main'.");
          print('');
          print('nothing to commit, working tree clean');
          print('(tips: temat delas mellan flikar. Vad händer om två flikar ändrar det samtidigt? 🤔)', 'dim');
          return;
        }
        if (sub === 'merge' || sub === 'pull') {
          var incoming = sub === 'pull' ? (current === 'dark' ? 'light' : 'dark') : (args[1] || '');
          if (sub === 'merge' && !incoming) { print('fatal: No remote for the current branch.', 'err'); return; }
          if (incoming === '2008' || current === '2008') { print('fatal: refusing to merge unrelated histories', 'err'); return; }
          if (!conflictable(incoming)) { print('merge: ' + incoming + ' - not something we can merge', 'err'); return; }
          if (incoming === current) { print('Already up to date.'); return; }
          print('Auto-merging theme');
          print('CONFLICT (content): Merge conflict in theme', 'err');
          print('Automatic merge failed; fix conflicts and then commit the result.', 'err');
          return wait(900).then(function () {
            close();
            return mergeConflict(current, incoming, sub === 'pull' ? 'origin/main' : incoming);
          }).then(open);
        }
        if (sub === 'remote') {
          if (args[1] !== '-v') { print('origin'); print('preview'); return; }
          print('origin   https://github.com/lilja85/christofferlilja.se.git (fetch)');
          print('origin   https://github.com/lilja85/christofferlilja.se.git (push)');
          print('preview  https://christofferlilja-se.pages.dev (Cloudflare Pages, varje branch får en egen)');
          print(root.dataset.env === 'preview'
            ? '(du är i förhandsvisningen just nu. Produktionen: open production)'
            : '(nyfiken på vad som är på väg? open preview)', 'dim');
          return;
        }
        if (sub === 'push' && (args.indexOf('--force') !== -1 || args.indexOf('-f') !== -1)) {
          print('remote: error: GH006: Protected branch update failed for refs/heads/main.', 'err');
          print('remote: error: Force push till main är blockerat av branch protection. 🛡️', 'err');
          return;
        }
        if (sub === 'push') { print('Everything up-to-date'); return; }
        if (sub === 'blame') {
          print('^7e55a5c (Christoffer Lilja 2008-03-26) <?php echo $myAge; ?>');
          print('Ja, det var jag. Allt är mitt fel. Sedan 2004.', 'dim');
          return;
        }
        if (!sub) { print('användning: git status | pull | merge <light|dark> | push | blame'); return; }
        print("git: '" + sub + "' is not a git command. See 'git --help'.", 'err');
      },
      rm: function (args) {
        if (isDangerousRm(args)) return nedry();
        print('rm: behörighet saknas', 'err');
      },
      make: function (args) {
        if (args.join(' ').toLowerCase() === 'me a sandwich') { print('What? Make it yourself.'); return; }
        print('make: *** Ingen regel för att skapa målet \'' + (args[0] || '') + '\'.  Stopp.', 'err');
      },
      shutdown: function () { return denied('shutdown'); },
      reboot: function () { return denied('reboot'); },
      launch: function () { return denied('launch'); },
      hire: function () {
        print('hire: behörighet saknas. Anställningar kräver sudo. 😉', 'err');
      },
      vim: function () {
        close();
        return new Promise(function (resolve) {
          Fx.vim(function () {
            open();
            print('Grattis, du tog dig ur vim! Det klarar inte alla. 🎉', 'log');
            resolve();
          });
        });
      },
      history: function () {
        history.forEach(function (h, i) { print(String(i + 1).padStart(4, ' ') + '  ' + h); });
      },
      date: function () { print(new Date().toString()); },
      uname: function () {
        var env = root.dataset.env === 'preview' ? 'förhandsvisning på Cloudflare Pages' : 'produktion på webbhotellet';
        print('ChristofferOS 2026 (Astro/statisk, ' + env + ') x86_64 – inga cookies, ingen spårning');
      },
      pwd: function () { print('/home/besokare'); },
      cd: function () { print('cd: det finns ingenstans att gå. Det här är en statisk sida. 🙂', 'dim'); },
      clear: function () { out.textContent = ''; },
      exit: function () { close(); }
    };

    function run(line) {
      if (!line) return;
      var parts = line.split(/\s+/);
      var name = parts[0].toLowerCase();
      var fn = commands[name];
      if (fn) return fn(parts.slice(1));
      print(name + ': kommandot hittades inte. Skriv "help".', 'err');
    }

    return { open: open, close: close, print: print };
  })();

  if (Fx) Fx.afterLoad(auditLog);

  // --- Tangentbordslyssnare ------------------------------------------------
  var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var pos = 0;
  var typed = '';
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (root.dataset.fx) return; // en effekt eller säkerhetskontrollen pågår

    if (e.key === '.' || e.code === 'Backquote') {
      e.preventDefault();
      term.open();
      return;
    }

    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = key === konami[pos] ? pos + 1 : (key === konami[0] ? 1 : 0);
    if (pos === konami.length) { pos = 0; sudo(); }

    if (key.length === 1) {
      typed = (typed + key).slice(-4);
      if (typed === 'sudo') sudo();
    }
  });

  // --- Påskägg: hälsning i konsolen ---------------------------------------
  var art = [
    '┌───────────────────────────────────┐',
    '│ $ whoami                          │',
    '│ christoffer  (devsecops, nörd)    │',
    '│ $ cat /etc/motd                   │',
    '│ Välkommen! Bygg säkert, ha kul.   │',
    '└───────────────────────────────────┘'
  ].join('\n');
  console.log('%c' + art, 'color:#1f6f5c;font-family:monospace');
  console.log(
    'Hej! Kul att du tittar under huven. 🔧\n\n' +
    '• Hittat en säkerhetsbrist? Se /.well-known/security.txt\n' +
    '• Vem gjorde sidan? Se /humans.txt\n' +
    '• Tips: tryck "." för en terminal och kör "sudo -l", eller prova Konami-koden (↑ ↑ ↓ ↓ ← → ← → B A).\n' +
    '• Psst: det går att skriva "sudo" direkt på sidan också.'
  );
})();
