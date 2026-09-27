// Körs blockerande i <head> så att sparat tema sätts innan sidan ritas.
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark' || t === '2008') document.documentElement.dataset.theme = t;
  } catch (e) {}
})();
