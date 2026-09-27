(function () {
  var root = document.documentElement;

  // --- Temaväxlare --------------------------------------------------------
  var toggle = document.getElementById('theme-toggle');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    var t = root.dataset.theme;
    if (t === 'light' || t === 'dark') return t;
    return darkQuery.matches ? 'dark' : 'light';
  }
  function setTheme(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch (e) {}
    updateLabel();
    document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  }
  function updateLabel() {
    if (!toggle) return;
    toggle.setAttribute('aria-label', currentTheme() === 'dark' ? 'Byt till ljust tema' : 'Byt till mörkt tema');
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      // Från 2008-läget går knappen tillbaka till nutiden
      if (root.dataset.theme === '2008') setTheme(darkQuery.matches ? 'dark' : 'light');
      else setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
    darkQuery.addEventListener('change', updateLabel);
    updateLabel();
  }

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
    if (root.classList.contains('sudo')) {
      toast('sudo: du har redan förhöjd behörighet. Least privilege, tack.');
      term.print('sudo: du har redan förhöjd behörighet. Least privilege, tack.');
      return;
    }
    root.classList.add('sudo');
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
  function expireSudo(early) {
    clearInterval(sudoTick);
    clearTimeout(sudoTimer);
    root.classList.remove('sudo');
    stripTitle();
    var msg = early
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

  var term = (function () {
    var el, out, input, history = [], histPos = 0, buffer = [];

    function build() {
      el = document.createElement('div');
      el.className = 'term';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Terminal');
      el.hidden = true;
      el.innerHTML =
        '<div class="term-bar"><span>christoffer@christofferlilja.se: ~</span>' +
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
      buffer.forEach(function (b) { print(b[0], b[1]); });
      buffer = [];
    }

    function print(text, cls) {
      if (!out) { buffer.push([text, cls]); return; }
      var line = document.createElement('div');
      if (cls) line.className = 'term-' + cls;
      line.textContent = text;
      out.appendChild(line);
      out.scrollTop = out.scrollHeight;
    }

    function printLink(label, href) {
      var line = document.createElement('div');
      var a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      line.appendChild(a);
      out.appendChild(line);
      out.scrollTop = out.scrollHeight;
    }

    function open() {
      if (!el) build();
      el.hidden = false;
      input.focus();
    }
    function close() {
      if (el) el.hidden = true;
    }
    function isOpen() {
      return el && !el.hidden;
    }

    function onKey(e) {
      if (e.key === 'Enter') {
        var cmd = input.value;
        input.value = '';
        if (cmd.trim()) { history.push(cmd); }
        histPos = history.length;
        print('$ ' + cmd, 'cmd');
        run(cmd.trim());
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

    var commands = {
      help: function () {
        print('Tillgängliga kommandon:');
        print('  whoami        vem är jag?');
        print('  ls [lab]      lista innehåll');
        print('  cat <fil>     visa en fil (prova about.txt)');
        print('  open <mål>    linkedin, lab, security, humans');
        print('  theme <val>   light | dark | 2008');
        print('  sudo [-k]     tidsbegränsad förhöjd behörighet (-k avslutar)');
        print('  history, date, uname, clear, exit');
      },
      whoami: function () {
        print('christoffer: DevSecOps & lösningsarkitektur, Jönköping.');
        print('Grupper: consid, devsecops, homelab, nördar');
      },
      ls: function (args) {
        if (args[0] === 'lab' || args[0] === 'lab/') {
          if (!labPosts.length) { print('(tomt, men det kommer)', 'dim'); return; }
          labPosts.forEach(function (p) { printLink(p.date + '  ' + p.title, p.url); });
          return;
        }
        print('about.txt  lab/  .well-known/  humans.txt  .secrets');
      },
      cat: function (args) {
        var f = args[0] || '';
        if (f === 'about.txt') {
          print('Utvecklare sedan 2007, numera mest säkerhet i leveranskedjan:');
          print('Azure DevOps, GitHub Advanced Security, Terraform, Entra ID och IAM/IGA.');
          print('Bygger hellre lösningar som teamen vill använda än regler de måste följa.');
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
      sudo: function (args) {
        if (args[0] === 'rm') { commands.rm(args.slice(1)); return; }
        if (args[0] === '-k') {
          if (root.classList.contains('sudo')) expireSudo(true);
          else print('Ingen aktiv förhöjning att återkalla.', 'dim');
          return;
        }
        sudo();
      },
      rm: function (args) {
        if (args.join(' ').indexOf('-rf') !== -1) print('rm: Nej. Bara nej. Den här incidenten har rapporterats. 🚨', 'err');
        else print('rm: behörighet saknas', 'err');
      },
      history: function () {
        history.forEach(function (h, i) { print(String(i + 1).padStart(4, ' ') + '  ' + h); });
      },
      date: function () { print(new Date().toString()); },
      uname: function () { print('ChristofferOS 2026 (Astro/statisk) x86_64 – inga cookies, ingen spårning'); },
      pwd: function () { print('/home/christoffer'); },
      cd: function () { print('cd: det finns ingenstans att gå. Det här är en statisk sida. 🙂', 'dim'); },
      clear: function () { out.textContent = ''; },
      exit: function () { close(); }
    };

    function run(line) {
      if (!line) return;
      var parts = line.split(/\s+/);
      var name = parts[0].toLowerCase();
      var fn = commands[name];
      if (fn) fn(parts.slice(1));
      else print(name + ': kommandot hittades inte. Skriv "help".', 'err');
    }

    return { open: open, close: close, isOpen: isOpen, print: print };
  })();

  // --- Tangentbordslyssnare ------------------------------------------------
  var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var pos = 0;
  var typed = '';
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

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
    '• Tips: tryck "." för en terminal, prova Konami-koden (↑ ↑ ↓ ↓ ← → ← → B A) eller skriv "sudo".'
  );
})();
