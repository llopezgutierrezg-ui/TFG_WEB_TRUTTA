/**
 * FloatField — UI objects drift as if floating on a river, but ONLY near the
 * cursor (proximity effect). Each element within RADIUS of the pointer eases
 * toward a small target offset (inertia + damping), so it sways as the cursor
 * passes instead of jumping. The motion never exceeds MAX_OFFSET px, so buttons
 * stay comfortably clickable, and the offset is a gentle pull *toward* the
 * cursor (it never flees).
 *
 * Performance:
 *  - the pointermove handler only stores the cursor coords (no work there);
 *  - all the maths runs once per frame on gsap.ticker (a single shared rAF);
 *  - element rects are cached and only re-measured on scroll/resize (and the
 *    cached centre is corrected for the element's own offset, avoiding both
 *    layout thrashing and feedback).
 *  - it uses the CSS `translate` property (independent of `transform`) so it
 *    composes with existing positioning/animations instead of overriding them.
 */
import { gsap } from 'gsap';

// Allowlist of driftable elements across the WHOLE site (every section we've
// built), so the river-float reacts wherever the cursor goes — not just the
// landing. Buttons/CTAs are never listed, so they stay put and clickable.
const SELECTOR = [
  // landing · banner + intro
  '.banner__kicker', '.banner__logo-main',
  '.intro__ph', '.intro__lead',
  // landing · archivos vivos expositores
  '.archivos__title', '.archivos__sub',
  '.expo__ph', '.expo__name', '.expo__num',
  '.expo__heading', '.expo__vol', '.expo__desc-short', '.expo__desc',
  // landing · experiencias (bitácoras) — text only (photos are buttons)
  '.bitacoras__title', '.bita__author', '.bita__message', '.bita__place',
  '.bita__quote-sm', '.bita__quote-lg',
  // landing · footer
  '.site-footer__fish', '.site-footer__logo', '.site-footer__claim',
  '.site-footer__col-h', '.site-footer__copy',
  // recorrido (ArchivosVivos): rótulo, manifiesto, apartados
  '.flow__lozoya',
  '.manifiesto__fish', '.manifiesto__lead', '.manifiesto__body',
  '.apartado__num', '.apartado__name', '.foto-tag', '.foto-desc',
  // overlay foto-detalle
  '.foto-detalle__txt', '.foto-detalle__tag', '.foto-detalle__fish',
  // NOTE: buttons/CTAs (.expo__cta, .bita__share, .bita__arrow, .bita__cell,
  // .apartado__ph, .flow__skip, .btn-line, .float-toggle) are intentionally
  // excluded so they never drift under the cursor.
].join(', ');

const RADIUS = 240;     // px — influence radius around the cursor
const MAX_OFFSET = 14;  // px — hard cap on the sway
const EASE = 0.085;     // 0..1 — damping toward the target (lower = more inertia)

export class FloatField {
  constructor(root) {
    this.root = root;
    this.running = false;
    this.items = [];
    this.mx = -9999; this.my = -9999; // cursor in viewport coords (offscreen at first)
    this._dirty = true;               // rects need re-measuring (scroll/resize)
    this._needsCollect = true;        // the element set changed (section/overlay swap)
    this._onMove = (e) => { this.mx = e.clientX; this.my = e.clientY; };
    this._onScrollOrResize = () => { this._dirty = true; };
    this._tick = this._tick.bind(this);
    // sections and overlays are built/destroyed and shown/hidden on the fly, so
    // re-collect whenever the DOM tree changes or a [hidden] toggles (overlay
    // open/close). The callback only flips a flag — the work runs once per frame.
    this._mo = new MutationObserver(() => { this._needsCollect = true; });
  }

  _collect() {
    // carry over the live offset for elements that survive a re-collect, so a
    // DOM mutation (carousel re-render, overlay swap) doesn't snap them to rest.
    const prev = new Map(this.items.map((it) => [it.el, it]));
    this.items = [...this.root.querySelectorAll(SELECTOR)].map((el) => {
      el.style.willChange = 'translate';
      // `translate`/`transform` don't apply to non-replaced inline elements
      // (e.g. the .banner__kicker <span>) → promote them so the sway shows.
      if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block';
      const p = prev.get(el);
      return { el, cx: 0, cy: 0, x: p ? p.x : 0, y: p ? p.y : 0 }; // centre (cx,cy) + current offset (x,y)
    });
  }

  /** Cache each element's rest rect + centre (corrected for its applied offset). */
  _measure() {
    for (const it of this.items) {
      const r = it.el.getBoundingClientRect();
      it.l = r.left - it.x; it.t = r.top - it.y;       // rest-position rect edges
      it.rr = r.right - it.x; it.bb = r.bottom - it.y;
      it.cx = (it.l + it.rr) / 2; it.cy = (it.t + it.bb) / 2;
    }
    this._dirty = false;
  }

  start() {
    if (this.running) return;
    this._needsCollect = true;
    this._dirty = true;
    this.running = true;
    window.addEventListener('pointermove', this._onMove, { passive: true });
    window.addEventListener('scroll', this._onScrollOrResize, { passive: true });
    window.addEventListener('resize', this._onScrollOrResize, { passive: true });
    this._mo.observe(this.root, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    gsap.ticker.add(this._tick);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('scroll', this._onScrollOrResize);
    window.removeEventListener('resize', this._onScrollOrResize);
    this._mo.disconnect();
    gsap.ticker.remove(this._tick);
    for (const it of this.items) { it.x = 0; it.y = 0; it.el.style.translate = ''; }
  }

  _tick() {
    if (this._needsCollect) { this._collect(); this._needsCollect = false; this._dirty = true; }
    if (this._dirty) this._measure();  // re-measure after a scroll/resize/recollect
    const { mx, my } = this;
    for (const it of this.items) {
      let tx = 0, ty = 0;
      // distance from the cursor to the element's RECT (0 while hovering over it),
      // so big blocks react when the pointer is on them — not only near the centre.
      const nx = mx < it.l ? it.l : (mx > it.rr ? it.rr : mx);
      const ny = my < it.t ? it.t : (my > it.bb ? it.bb : my);
      const edge = Math.hypot(mx - nx, my - ny);
      if (edge < RADIUS) {
        const influence = 1 - edge / RADIUS;        // 1 over the block → 0 at the edge of reach
        const dx = mx - it.cx, dy = my - it.cy;     // sway toward the cursor's side
        const d = Math.hypot(dx, dy) || 1;
        // magnitude grows from the centre (0) out to MAX_OFFSET, so it reacts all
        // over the block yet glides smoothly through the middle (no sign flip).
        const mag = Math.min(MAX_OFFSET, d) * influence;
        tx = (dx / d) * mag;
        ty = (dy / d) * mag;
      }
      // inertia: ease the current offset toward the target (water-like drift)
      it.x += (tx - it.x) * EASE;
      it.y += (ty - it.y) * EASE;
      it.el.style.translate = `${it.x.toFixed(2)}px ${it.y.toFixed(2)}px`;
    }
  }
}
