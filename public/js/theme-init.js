// Körs blockerande i <head> så att sparat tema sätts innan sidan ritas.
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  } catch (e) {}
})();
