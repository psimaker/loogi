// LOOGI minimal client-side behaviour.
// Cmd/Ctrl-K fokussiert die Suche; Backspace im leeren Feld navigiert zum Index.
(function () {
  'use strict';

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key && e.key.toLowerCase() === 'k') {
      var q = document.getElementById('q');
      if (q) {
        e.preventDefault();
        q.focus();
        q.select();
      }
    }
  });

  // Back-to-top sichtbar ab 600px Scroll.
  var btt = document.getElementById('backToTop');
  if (btt) {
    var toggle = function () {
      btt.style.display = window.scrollY > 600 ? 'block' : 'none';
    };
    toggle();
    window.addEventListener('scroll', toggle, { passive: true });
    var link = btt.querySelector('a');
    if (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }
})();
