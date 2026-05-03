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

  // Search focus shortcut + Auto-Type: jeder Buchstaben/Ziffer/Zeichen-Tastendruck
  // ausserhalb eines anderen Inputs fokussiert die Suchleiste und setzt das
  // Zeichen ein. Funktioniert auf Landingpage UND Ergebnisseite.
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

    // Auto-Type: ueberspringen wenn user bereits in einem Input/Textarea ist
    if (isEditableTarget(document.activeElement)) return;
    // Auf Touch-Geraeten (Phone/Tablet) Auto-Type komplett aus —
    // mobile Keyboards triggern keydown nicht zuverlaessig und der
    // erzwungene Focus oeffnet das Keyboard ungewollt.
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    // Modifier-Tasten (ausser Shift fuer Grossbuchstaben) ignorieren
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // Nur druckbare Einzelzeichen (Buchstaben, Ziffern, Symbole, Leerzeichen)
    if (e.key.length !== 1) return;

    e.preventDefault();
    q.focus();
    q.value = q.value + e.key;
    // Cursor ans Ende setzen
    var pos = q.value.length;
    q.setSelectionRange(pos, pos);
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

  // Filter-Sidebar collapse persistence.
  // Tablet (641–1023 px) ohne gespeicherte Pref: default collapsed —
  // 240 px Sidebar nimmt auf iPad-portrait sonst zu viel Breite weg.
  // User-Toggle ueberschreibt persistent (siehe Klick-Handler weiter unten).
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

  // Off-Canvas-Drawer fuer Filter-Sidebar (Phone). Body-Klasse drawer_open
  // toggelt CSS-Transform (siehe loogi.css @media max-width:640px).
  // Schliessen via: Hamburger erneut, Overlay-Tap, ESC, Resize > 640.
  //
  // Body-Scroll-Lock per position:fixed-Pattern statt overflow:hidden —
  // letzteres triggert auf iOS Safari einen Scroll-Container-Wechsel der
  // nach dem Schliessen einen schwarzen Restbalken am Bottom hinterlassen
  // kann (URL-Bar-State steckt fest, dvh-Hoehe verkuerzt sich permanent).
  // Mit position:fixed + top:-scrollY bleibt der Body genau dort wo er
  // war, und nach restore() scrollen wir die Original-Position wieder her.
  var drawerToggle = document.getElementById('drawer_toggle');
  var drawerOverlay = document.getElementById('drawer_overlay');
  var savedScrollY = 0;
  function setDrawerOpen(open) {
    var isOpen = document.body.classList.contains('drawer_open');
    if (open === isOpen) return;
    if (open) {
      savedScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + savedScrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.classList.add('drawer_open');
    } else {
      document.body.classList.remove('drawer_open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, savedScrollY);
    }
    if (drawerToggle) drawerToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
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
