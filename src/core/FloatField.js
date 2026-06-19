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

const SELECTOR = [
  '.intro__ph', '.expo__ph',
  '.expo__name', '.expo__num', '.expo__heading',
  '.archivos__title', '.bitacoras__title',
  '.banner__kicker', '.banner__logo-main',
  '.site-footer__fish', '.site-footer__logo',
  '.intro__lead', '.expo__desc',
  // NOTE: buttons (.expo__cta, .bita__share, .float-toggle) are intentionally
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
    this._onMove = (e) => { this.mx = e.clientX; this.my = e.clientY; };
    this._onScrollOrResize = () => { this._dirty = true; };
    this._tick = this._tick.bind(this);
  }

  _collect() {
    this.items = [...this.root.querySelectorAll(SELECTOR)].map((el) => {
      el.style.willChange = 'translate';
      return { el, cx: 0, cy: 0, x: 0, y: 0 }; // centre (cx,cy) + current offset (x,y)
    });
  }

  /** Cache each element's rest centre (corrected for its current applied offset). */
  _measure() {
    for (const it of this.items) {
      const r = it.el.getBoundingClientRect();
      it.cx = r.left + r.width / 2 - it.x;
      it.cy = r.top + r.height / 2 - it.y;
    }
    this._dirty = false;
  }

  start() {
    if (this.running) return;
    if (!this.items.length) this._collect();
    this._dirty = true;
    this.running = true;
    window.addEventListener('pointermove', this._onMove, { passive: true });
    window.addEventListener('scroll', this._onScrollOrResize, { passive: true });
    window.addEventListener('resize', this._onScrollOrResize, { passive: true });
    gsap.ticker.add(this._tick);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('scroll', this._onScrollOrResize);
    window.removeEventListener('resize', this._onScrollOrResize);
    gsap.ticker.remove(this._tick);
    for (const it of this.items) { it.x = 0; it.y = 0; it.el.style.translate = ''; }
  }

  _tick() {
    if (this.root.hidden) return;      // landing not visible → nothing to move
    if (this._dirty) this._measure();  // re-measure only after a scroll/resize
    const { mx, my } = this;
    for (const it of this.items) {
      let tx = 0, ty = 0;
      const dx = mx - it.cx, dy = my - it.cy;
      const dist = Math.hypot(dx, dy);
      if (dist < RADIUS) {
        // sway toward the cursor, fading out with distance; 0 right under it
        const influence = 1 - dist / RADIUS;        // 1 near → 0 at the edge
        const mag = Math.min(MAX_OFFSET, MAX_OFFSET * influence);
        tx = (dx / (dist || 1)) * mag;
        ty = (dy / (dist || 1)) * mag;
      }
      // inertia: ease the current offset toward the target (water-like drift)
      it.x += (tx - it.x) * EASE;
      it.y += (ty - it.y) * EASE;
      it.el.style.translate = `${it.x.toFixed(2)}px ${it.y.toFixed(2)}px`;
    }
  }
}
