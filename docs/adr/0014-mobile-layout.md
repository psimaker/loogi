# 0014 — Mobile layout (phone drawer + tablet collapsed default)

* Status: accepted
* Date: 2026-04-09

## Context

The design prototype only exists in a desktop variant. The LOOGI theme
CSS so far had two rudimentary sub-desktop breakpoints (carried over from
[ADR 0013](./0013-three-column-results-layout.md)):

* `@media (max-width: 1180 px)` — smaller padding (originally meant for
  a right info column that no longer exists).
* `@media (max-width: 880 px)` — layout flips to a vertical stack: the
  filter sidebar moves above the results at full width.

On a 375 px iPhone viewport the vertical stack is unusable:

* The 240 px filter sidebar takes the full width after the flip and
  pushes results 2–3 screen-heights down.
* The 72 px topbar (40 px logo + 48 px search box) is too tall for phone
  proportions.
* Result hover-actions (External / EyeOff) aren't reachable on touch
  devices that have no hover event.
* Pagination buttons (36×32) are below the Apple HIG 44 px touch target.
* Auto-type focus (every keydown outside an input focuses the search bar)
  misfires on mobile browsers: keydown events are inconsistent, and the
  forced focus opens the system keyboard unintentionally.
* The iOS notch / home bar aren't respected (no `viewport-fit=cover`,
  no `env(safe-area-inset-*)`).

Mobile optimisation is therefore necessary. There's no prototype to port
1:1, so the layout is built pragmatically from the desktop design system
(OKLCH tokens, Inter Tight + JBM, 8 px grid). Constraints from the
project's hard rules:

* Desktop (≥ 1024 px) **must not** change — all changes go under
  `@media (max-width: 1023 px)`.
* The theme stays vanilla CSS / JS, no build step
  ([ADR 0003](./0003-own-docker-image-vs-volume-mounts.md)).
* i18n in EN/DE/FR/ES/IT must remain
  ([ADR 0007](./0007-i18n-auto-detect-five-languages.md)).
* Touch targets ≥ 44 px (Apple HIG).

## Decision

LOOGI gets a 3-tier breakpoint structure:

| Range | Width | Behaviour |
|-------|-------|-----------|
| Desktop | ≥ 1024 px | Unchanged (240 sidebar + center, 72 topbar) |
| Tablet  | 641–1023 px | Layout stays; padding tighter; filter sidebar default-collapsed (56 px icon strip) via JS init |
| Phone   | ≤ 640 px | Off-canvas drawer for the filter sidebar; compact topbar (56) with hamburger button; tabs horizontal-scrollable; result actions always visible; pagination 44×44; auto-type-focus off |

Components:

* **Off-canvas drawer (phone)**: `#filters_sidebar` becomes
  `position: fixed`, `width: min(85vw, 320px)`, `transform: translateX(-100%)`.
  Body class `drawer_open` slides it in (`translateX(0)`) and locks
  body scroll (`overflow: hidden`). A backdrop overlay
  (`#drawer_overlay`) dims the background (rgba 0.55) and closes the
  drawer on tap. Also closed via hamburger click again, ESC, or resize
  > 640 px.
* **Hamburger button**: `#drawer_toggle` on the right of the topbar
  (`[Logo] [Search box flex:1] [Hamburger]`),
  `aria-controls="filters_sidebar"` + `aria-expanded` synced to drawer
  state. Only visible on phone (`display:none` by default).
* **Tablet collapsed default**: JS init checks
  `localStorage.getItem('loogi_sidebar_collapsed')` on load — if `null`
  and viewport width is 641–1023 px, sets `body.sidebar_collapsed`. The
  user toggle in the sidebar header overrides persistently
  (`'1'` or `'0'`).
* **Tabs h-scroll (phone)**: `#categories` `overflow-x: auto` + touch
  inertia, scrollbar visually hidden. `results_meta` (≈ X results)
  hidden on phone — redundant with tab counts.
* **Result actions touch (phone)**: `.result_actions` `opacity: 1` +
  `pointer-events: auto`, `flex-direction: row`, 40×40 tap target.
* **iOS notch**: viewport meta `viewport-fit=cover` +
  `env(safe-area-inset-*)` for topbar (`padding-top`), drawer
  (`padding-top` / `padding-bottom`), pagination, footer, main column.
* **Auto-type-focus skip**: `matchMedia('(pointer: coarse)')` check in
  the keydown handler before the auto-type logic. Cmd/Ctrl-K shortcut
  stays active (touch laptops with hardware keyboard).

Implementation: `theme/loogi/static/css/loogi.css` (`@media` blocks at
the end), `theme/loogi/static/js/loogi.js`, and
`theme/loogi/templates/{base.html,search.html,results.html}`.

## Alternatives considered

* **Stay on the vertical-stack fallback** (status quo from ADR 0013):
  minimally invasive. Rejected — on 375 px phones the 240 px filter block
  at the top (full width, all three sections expanded) is unusable. The
  drawer pattern keeps results above the fold and gives filters their
  own layer.
* **Bottom sheet instead of left off-canvas drawer**: common on iOS-native.
  Rejected — the filter list spans 5 sections (Time, Language, Safesearch
  plus the sidebar header and future Sources / Region candidates), too
  long for a sheet that only partially fits the screen. An off-canvas
  drawer can scroll full height.
* **Modal overlay (centered, dimmed background)**: rejected — feels more
  blocking than a drawer and hides the results during filter selection.
  A drawer with semi-transparent backdrop keeps the result context
  visible.
* **Pure-CSS tablet collapsed default** (no localStorage, no JS init):
  via `@media (641-1023px) #filters_sidebar { width: 56px; ... }` and a
  toggle class. Rejected — no user-toggle persistence. If a tablet user
  expands the sidebar once, it should stay expanded (across reloads).
* **Breakpoint at 768 px instead of 640/1023**: 768 is iPad portrait.
  Rejected — iPad portrait should get tablet treatment (sidebar layout
  preserved), not phone-drawer treatment. 640 is the natural cut between
  "smartphones (incl. plus-size phones, max ~430 logical px)" and
  "small tablet / large phone". 1023 is the natural lower bound of
  tablet-landscape and small notebooks (1024 = desktop).
* **Hamburger on the left**: Material / Google style. Rejected in favour
  of `[Logo] [Search] [Hamburger]` — the search box is primary and gets
  the most space; the hamburger is secondary and on the right.

## Consequences

* **Positive**:
  * Mobile experience works on 375 px viewports (iPhone SE) without
    horizontal scroll or layout breakage.
  * Notch and home bar respected on modern iPhones (bar pushes down,
    footer pushes up).
  * Apple HIG touch target ≥ 44 px met for pagination and hamburger.
  * iPad portrait (768) gets the filter sidebar default-collapsed — the
    center column gets the full available width.
  * Body scroll lock with the drawer open prevents the iOS bouncing
    glitch.

* **Negative / trade-off**:
  * +98 lines of CSS (`@media` blocks at the end) and +30 lines of JS
    (drawer toggle, tablet init, auto-type skip, resize cleanup) — the
    theme footprint grows by ~10 %.
  * Result actions on phone are 40×40 instead of 44×44 — slightly under
    Apple HIG, but 44 blows up the narrow result column. Accepted.
  * `body.sidebar_collapsed` and `body.drawer_open` are separate states
    that can co-occur on phone (if the user previously collapsed on
    tablet / desktop). CSS explicitly suppresses `sidebar_collapsed` on
    phone (the drawer pattern dominates) — an extra source of truth that
    stays visible in the rule list.
  * No mobile prototype — visual choices (drawer animation, hamburger
    position, backdrop opacity) are pragmatic conventions, not a 1:1
    port.

* **Follow-ups** (separate ADRs if picked up):
  * Possibly a bottom toolbar with filter pills as an alternative to the
    drawer, if the drawer interaction turns out to feel heavyweight.
  * Draw a mobile prototype variant when there's time and diff against
    the current pragmatic implementation.
  * Browser verification on real devices (iPhone SE 375×667, iPhone 14
    Pro 393×852, iPad portrait 768×1024) — CLI tests can't simulate
    mobile rendering.
