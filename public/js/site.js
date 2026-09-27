(function () {
  var root = document.documentElement;

  // --- Temaväxlare --------------------------------------------------------
  var toggle = document.getElementById('theme-toggle');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    return root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');
  }
  function updateLabel() {
    if (!toggle) return;
    toggle.setAttribute('aria-label', currentTheme() === 'dark' ? 'Byt till ljust tema' : 'Byt till mörkt tema');
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      updateLabel();
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

  // --- Påskägg: sudo-läge (Konami-koden eller skriv "sudo") -----------------
  // Tidsbegränsad förhöjd behörighet, som Entra ID PIM. Stående behörigheter är ju inget att ha.
  var SUDO_SECONDS = 60;
  var sudoTimer, sudoTick;
  function sudo() {
    if (root.classList.contains('sudo')) {
      toast('sudo: du har redan förhöjd behörighet. Least privilege, tack.');
      return;
    }
    root.classList.add('sudo');
    var left = SUDO_SECONDS;
    toast('[PIM] Rollen "Global Nörd" aktiverad i ' + left + ' s. Motivering: "ville bara testa".', 5000);
    console.log('%c[PIM] Aktivering godkänd. Loggad för granskning.', 'color:#39ff6a;font-family:monospace');
    sudoTick = setInterval(function () {
      left--;
      document.title = document.title.replace(/^\[sudo \d+s\] /, '');
      if (left > 0) document.title = '[sudo ' + left + 's] ' + document.title;
    }, 1000);
    sudoTimer = setTimeout(function () {
      clearInterval(sudoTick);
      root.classList.remove('sudo');
      document.title = document.title.replace(/^\[sudo \d+s\] /, '');
      toast('[PIM] Aktiveringen har löpt ut. Behörigheten är återkallad. 🔒');
    }, SUDO_SECONDS * 1000);
  }

  var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var pos = 0;
  var typed = '';
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
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
    '• Tips: prova Konami-koden (↑ ↑ ↓ ↓ ← → ← → B A) eller skriv "sudo" på sidan.'
  );
})();
