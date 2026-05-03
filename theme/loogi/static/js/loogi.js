// LOOGI client-side behaviour.
// - Cmd/Ctrl-K fokussiert die Suche.
// - Back-to-top sichtbar ab 600px Scroll.
// - Tweaks-Panel: Density (compact/comfortable/spacious) + Accent
//   (teal/amber/magenta/lime) live via CSS-Variablen auf :root + body class.
//   State wird in localStorage persistent gemacht.
// - AISummary "Hide"-Button blendet das Banner pro Session aus.
(function () {
  'use strict';

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

  // ── Tweaks panel ─────────────────────────────────────────────────────────
  var ACCENTS = {
    teal:    ['oklch(0.80 0.105 195)', 'oklch(0.80 0.105 195 / 0.14)', 'oklch(0.80 0.105 195 / 0.35)'],
    amber:   ['oklch(0.80 0.13 78)',   'oklch(0.80 0.13 78 / 0.14)',   'oklch(0.80 0.13 78 / 0.35)'],
    magenta: ['oklch(0.74 0.16 340)',  'oklch(0.74 0.16 340 / 0.14)',  'oklch(0.74 0.16 340 / 0.35)'],
    lime:    ['oklch(0.86 0.16 130)',  'oklch(0.86 0.16 130 / 0.14)',  'oklch(0.86 0.16 130 / 0.35)'],
  };

  function applyAccent(name) {
    var a = ACCENTS[name] || ACCENTS.teal;
    var root = document.documentElement;
    root.style.setProperty('--accent', a[0]);
    root.style.setProperty('--accent-soft', a[1]);
    root.style.setProperty('--accent-line', a[2]);
    try { localStorage.setItem('loogi_accent', name); } catch (_) {}
  }

  function applyDensity(name) {
    var body = document.body;
    body.classList.remove('density_compact', 'density_comfortable', 'density_spacious');
    body.classList.add('density_' + name);
    try { localStorage.setItem('loogi_density', name); } catch (_) {}
  }

  function setActiveSeg(seg, value) {
    var btns = seg.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-value') === value);
    }
  }

  // Restore on load
  try {
    var savedAccent = localStorage.getItem('loogi_accent');
    if (savedAccent && ACCENTS[savedAccent]) applyAccent(savedAccent);
    var savedDensity = localStorage.getItem('loogi_density');
    if (savedDensity) applyDensity(savedDensity);
  } catch (_) {}

  // Wire up panel
  var panel = document.getElementById('tweaks_panel');
  if (panel) {
    var segs = panel.querySelectorAll('.tweaks_seg');
    segs.forEach(function (seg) {
      var tweak = seg.getAttribute('data-tweak');
      // Reflect persisted value in segments
      try {
        var saved = localStorage.getItem('loogi_' + tweak);
        if (saved) setActiveSeg(seg, saved);
      } catch (_) {}
      seg.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-value]');
        if (!btn) return;
        var value = btn.getAttribute('data-value');
        setActiveSeg(seg, value);
        if (tweak === 'accent') applyAccent(value);
        if (tweak === 'density') applyDensity(value);
      });
    });
  }

  // AISummary hide
  document.querySelectorAll('.aisummary_action_dismiss').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.aisummary');
      if (card) card.style.display = 'none';
    });
  });

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
