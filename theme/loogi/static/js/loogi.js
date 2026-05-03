// LOOGI client-side behaviour.
// - Cmd/Ctrl-K fokussiert die Suche.
// - Back-to-top sichtbar ab 600px Scroll.
// - Sidebar-Collapse-Persistenz via localStorage.
// - Region/Sources Click-Toggle (visual-only — Designprototyp-Komponenten
//   ohne SearXNG-Backing).
(function () {
  'use strict';

  // Flip no-js → js so CSS hide_if_nojs / show_if_nojs greift wie erwartet
  // (autocomplete-Box bleibt sonst sichtbar mit leerer Border).
  document.documentElement.classList.replace('no-js', 'js');

  // Search focus shortcut
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

  // Back-to-top sichtbar ab 600px Scroll
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

  // Filter-Sidebar collapse persistence
  try {
    if (localStorage.getItem('loogi_sidebar_collapsed') === '1') {
      document.body.classList.add('sidebar_collapsed');
    }
  } catch (_) {}
  document.querySelectorAll('.sidebar_collapse_btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var collapsed = document.body.classList.contains('sidebar_collapsed');
      try { localStorage.setItem('loogi_sidebar_collapsed', collapsed ? '1' : '0'); } catch (_) {}
    });
  });

  // Sources checkbox toggle (visual only — kein SearXNG-Backing)
  document.querySelectorAll('.checkbox_option').forEach(function (label) {
    label.addEventListener('click', function (e) {
      e.preventDefault();
      label.classList.toggle('checked');
    });
  });

  // Region radio toggle (visual only)
  document.querySelectorAll('.filter_section').forEach(function (section) {
    var label = section.querySelector('.filter_label');
    if (!label || label.textContent.trim().toLowerCase().indexOf('region') !== 0) return;
    section.querySelectorAll('.radio_option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        section.querySelectorAll('.radio_option').forEach(function (o) {
          o.classList.remove('selected');
        });
        opt.classList.add('selected');
      });
    });
  });
})();
