/**
 * BITÁCORAS — autoplay carousel of visitor logs. Each entry holds 3–6 photos and
 * the grid mutates with N (per the brief):
 *   N=3 → 1 large + 1 medium + 1 small (small fills the medium's slot)
 *   N=4 → + 2 small  (50 / 50)
 *   N=5 → + 3 small  (1 elongated row on top, 2 below)
 *   N=6 → + 4 small  (2×2)
 * The form injects new entries via add(), which recalculates and re-animates.
 */
import { gsap } from 'gsap';
import { pool, asset } from '../core/Assets.js';

const AUTOPLAY_MS = 5000;

export class Bitacoras {
  constructor(root, { onShareClick } = {}) {
    this.root = root;
    this.onShareClick = onShareClick;
    this.entries = this._seed();
    this.index = 0;
    this._build();
    this._render(0);
    this._startAuto();
  }

  _seed() {
    const mk = (author, place, message, n) => ({
      author, place, message, images: pool(n, { thumb: true }),
    });
    return [
      mk('IVÁN PÉREZ', 'Buitrago del Lozoya', 'El agua bajaba clara como hacía años que no veía. Documenté cada meandro antes de que el embalse lo cubra todo.', 6),
      mk('LUCÍA GARCÍA', 'Valle del Tiétar', 'Tres días siguiendo el cauce. La trucha sigue ahí, contra todo pronóstico.', 4),
      mk('MARTÍN ALBA', 'Sierra de Gredos', 'Un silencio que solo rompe la corriente. Esto es lo que defendemos.', 5),
    ];
  }

  _build() {
    this.root.innerHTML = `
      <h2 class="bitacoras__title u-handwritten" data-i18n="bitacoras_title">EXPERIENCIAS</h2>
      <p class="archivos__sub" data-i18n="bitacoras_sub">Registro documental de ecosistemas bajo auditoría institucional.<br>
        y como se relacionan con los pueblos.</p>
      <div class="bita__viewport"></div>
      <div class="bita__nav">
        <button class="bita__arrow" data-dir="-1" aria-label="Anterior">‹</button>
        <div class="bita__dots"></div>
        <button class="bita__arrow" data-dir="1" aria-label="Siguiente">›</button>
      </div>
      <button class="btn-fill bita__share" data-act="form" data-i18n="share">COMPARTE TU EXPERIENCIA</button>`;

    this.viewport = this.root.querySelector('.bita__viewport');
    this.dots = this.root.querySelector('.bita__dots');
    this.root.querySelectorAll('.bita__arrow').forEach(btn =>
      btn.addEventListener('click', () => { this._go(this.index + +btn.dataset.dir); this._startAuto(); }));
    this.root.querySelector('.bita__share').addEventListener('click', () => this.onShareClick?.());
    // pause autoplay while interacting
    this.root.addEventListener('pointerenter', () => this._stopAuto());
    this.root.addEventListener('pointerleave', () => this._startAuto());
  }

  _render(i) {
    const e = this.entries[i];
    const n = e.images.length;
    const [large, medium, ...smalls] = e.images;
    const ph = (img, cls) => `<button class="${cls}"><img src="${img.url}" data-full="${img.src?.full || img.url}" alt=""></button>`;

    this.viewport.innerHTML = `
      <div class="bita__entry" data-n="${n}">
        ${ph(large, 'bita__cell bita__large')}
        <div class="bita__right">
          <div class="bita__photos">
            ${ph(medium, 'bita__cell bita__medium')}
            <div class="bita__smalls" data-n="${smalls.length}">
              ${smalls.map(s => ph(s, 'bita__cell bita__small')).join('')}
            </div>
          </div>
          <aside class="bita__testimonial">
            <img class="bita__quote-sm" src="${asset('svg/comilla-2.png')}" alt="" aria-hidden="true">
            <h3 class="bita__author">${e.author} DICE:</h3>
            <p class="bita__message">${e.message}</p>
            <p class="bita__place">— ${e.place}</p>
          </aside>
        </div>
        <img class="bita__quote-lg" src="${asset('svg/comilla-1.png')}" alt="" aria-hidden="true">
      </div>`;

    this.dots.innerHTML = this.entries
      .map((_, k) => `<span class="bita__dot${k === i ? ' is-active' : ''}"></span>`).join('');

    // re-animate the grid every time N may have changed
    gsap.fromTo(this.viewport.querySelectorAll('.bita__cell'),
      { autoAlpha: 0, scale: 0.92, y: 18 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06 });
    gsap.fromTo(this.viewport.querySelector('.bita__testimonial'),
      { autoAlpha: 0, x: 20 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power2.out', delay: 0.15 });
  }

  _go(i) {
    this.index = (i + this.entries.length) % this.entries.length;
    this._render(this.index);
  }

  _startAuto() {
    this._stopAuto();
    this._timer = setInterval(() => this._go(this.index + 1), AUTOPLAY_MS);
  }

  _stopAuto() { clearInterval(this._timer); }

  /** Inject a new visitor log (from the form) and jump to it with a re-animation. */
  add(entry) {
    this.entries.push(entry);
    this._go(this.entries.length - 1);
    this._startAuto();
  }
}
