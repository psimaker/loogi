// LOOGI client-side behaviour.
// - Cmd/Ctrl-K focuses the search.
// - Back-to-top visible after 600px of scroll.
// - Sidebar collapse persistence via localStorage.
// - Region/Sources click toggle (visual-only — design prototype components
//   with no SearXNG backing).
(function () {
  'use strict';

  // Flip no-js → js so CSS hide_if_nojs / show_if_nojs takes effect as
  // expected (otherwise the autocomplete box stays visible with an empty
  // border).
  document.documentElement.classList.replace('no-js', 'js');

  // ─── Debug overlay (gated by ?debug=1) ──────────────────────────
  // Live telemetry for iOS Safari viewport diagnosis. Shows innerHeight,
  // visualViewport.height/offsetTop, scrollY etc. plus the last 8 events.
  // Enable by appending ?debug=1 to the URL. On prod pages without the
  // param nothing is rendered — no performance impact.
  (function setupDebug() {
    try {
      if (!/[?&]debug=1\b/.test(location.search)) return;
    } catch (_) { return; }
    var ovl = document.createElement('div');
    ovl.id = '__loogi_dbg__';
    ovl.style.cssText = [
      'position:fixed', 'top:0', 'right:0', 'z-index:99999',
      'background:#ffeb3b', 'color:#000',
      'font:11px/1.25 ui-monospace,monospace',
      'padding:6px 8px', 'max-width:220px',
      'pointer-events:none', 'white-space:pre',
      'border-bottom-left-radius:6px', 'box-shadow:0 2px 8px rgba(0,0,0,.3)'
    ].join(';');
    var attach = function () { document.body.appendChild(ovl); };
    if (document.body) attach(); else document.addEventListener('DOMContentLoaded', attach);

    var log = [];
    function ts() {
      var d = new Date();
      return d.toTimeString().slice(3, 8) + '.' + String(d.getMilliseconds()).padStart(3, '0');
    }
    function pushEvt(name) {
      log.push(ts() + ' ' + name);
      if (log.length > 8) log.shift();
      render();
    }
    function render() {
      var vv = window.visualViewport;
      var lines = [
        'innerH   ' + window.innerHeight,
        'vvH      ' + (vv ? vv.height.toFixed(1) : 'n/a'),
        'vvOffT   ' + (vv ? vv.offsetTop.toFixed(1) : 'n/a'),
        'docCH    ' + document.documentElement.clientHeight,
        'bodyOH   ' + (document.body ? document.body.offsetHeight : 'n/a'),
        'scrollY  ' + Math.round(window.scrollY),
        '────────────',
      ];
      ovl.textContent = lines.concat(log).join('\n');
    }
    window.__loogiDbg = pushEvt;

    window.addEventListener('resize', function () { pushEvt('win-resize'); });
    window.addEventListener('scroll', render, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () { pushEvt('vv-resize'); });
      window.visualViewport.addEventListener('scroll', render);
    }
    if (document.body) render(); else document.addEventListener('DOMContentLoaded', render);
  })();

  // Search focus shortcut + auto-type: any letter / digit / character
  // keypress outside another input focuses the search bar and inserts the
  // character. Works on the landing page AND the results page.
  function isEditableTarget(el) {
    if (!el) return false;
    var tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return false;
  }
  document.addEventListener('keydown', function (e) {
    var q = document.getElementById('q');
    if (!q) return;

    // Cmd/Ctrl-K: explicit focus + select
    if ((e.metaKey || e.ctrlKey) && e.key && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      q.focus();
      q.select();
      return;
    }

    // Auto-type: skip if the user is already in an input / textarea
    if (isEditableTarget(document.activeElement)) return;
    // On touch devices (phone / tablet) disable auto-type entirely —
    // mobile keyboards don't trigger keydown reliably and forced focus
    // opens the keyboard unexpectedly.
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    // Ignore modifier keys (except Shift for uppercase)
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // Only printable single characters (letters, digits, symbols, space)
    if (e.key.length !== 1) return;

    e.preventDefault();
    q.focus();
    q.value = q.value + e.key;
    // Move cursor to the end
    var pos = q.value.length;
    q.setSelectionRange(pos, pos);
  });

  // Back-to-top visible after 600px of scroll
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

  // Filter sidebar collapse persistence.
  // Tablet (641–1023 px) with no stored pref: default collapsed —
  // a 240 px sidebar takes too much width on iPad portrait otherwise.
  // User toggle overrides persistently (see click handler below).
  try {
    var collapsedPref = localStorage.getItem('loogi_sidebar_collapsed');
    var w = window.innerWidth;
    var tabletDefault = (collapsedPref === null && w > 640 && w <= 1023);
    if (collapsedPref === '1' || tabletDefault) {
      document.body.classList.add('sidebar_collapsed');
    }
  } catch (_) {}
  document.querySelectorAll('.sidebar_collapse_btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var collapsed = document.body.classList.contains('sidebar_collapsed');
      try { localStorage.setItem('loogi_sidebar_collapsed', collapsed ? '1' : '0'); } catch (_) {}
    });
  });

  // Off-canvas drawer for the filter sidebar (phone). Body class
  // drawer_open toggles a CSS transform (see loogi.css @media
  // max-width:640px). Close via: hamburger again, overlay tap, ESC,
  // resize > 640.
  //
  // NO body scroll lock — drawer + overlay cover everything visually;
  // body scroll behind them is invisible. touch-action:none on the
  // overlay prevents swipe-induced body scroll.
  var drawerToggle = document.getElementById('drawer_toggle');
  var drawerOverlay = document.getElementById('drawer_overlay');
  function setDrawerOpen(open) {
    var isOpen = document.body.classList.contains('drawer_open');
    if (open === isOpen) return;
    document.body.classList.toggle('drawer_open', open);
    if (drawerToggle) drawerToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (window.__loogiDbg) window.__loogiDbg(open ? 'drawer-open' : 'drawer-close');
  }
  if (drawerToggle) {
    drawerToggle.addEventListener('click', function (e) {
      e.preventDefault();
      setDrawerOpen(!document.body.classList.contains('drawer_open'));
    });
  }
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', function () { setDrawerOpen(false); });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('drawer_open')) {
      e.preventDefault();
      setDrawerOpen(false);
    }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 640 && document.body.classList.contains('drawer_open')) {
      setDrawerOpen(false);
    }
  });

  // Sources checkbox toggle (visual only — no SearXNG backing)
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
