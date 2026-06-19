/**
 * FOTO DETALLE (Desktop 5) — full-screen overlay shown when ANY photo on the
 * site is clicked. Large image on top, two text columns + "FOTOGRAFÍA n/20"
 * label below, fish bottom-right, rama line-art bottom-left.
 * ESC / click on the backdrop / ✕ closes.
 */
import { gsap } from 'gsap';
import { asset } from '../core/Assets.js';

const TXT = `La trucha común (Salmo trutta) es el organismo indicador más confiable para evaluar la salud de
ecosistemas acuáticos de aguas frías. Su presencia confirma condiciones de oxigenación excepcional,
temperatura estable y ausencia total de contaminantes orgánicos o metales pesados. El río Lozoya,
afluente del Jarama en la Comunidad de Madrid, representa uno de los últimos refugios de pureza hídrica
absoluta en la Península Ibérica. Este expediente documenta su estado prístino a través de su habitante
más exigente.`;

export class FotoDetalle {
  constructor(app) {
    this.el = document.createElement('div');
    this.el.className = 'foto-detalle';
    this.el.hidden = true;
    this.el.innerHTML = `
      <figure class="foto-detalle__fig">
        <img alt="">
        <span class="rama foto-detalle__rama" data-rama="izq" aria-hidden="true"></span>
      </figure>
      <div class="foto-detalle__cols">
        <div class="foto-detalle__spacer" aria-hidden="true"></div>
        <p class="foto-detalle__txt">${TXT}</p>
        <p class="foto-detalle__txt">${TXT}</p>
        <div class="foto-detalle__meta">
          <p class="foto-detalle__tag"><span data-i18n="fotografia">FOTOGRAFÍA</span><br><span data-n>12</span>/20</p>
          <img class="foto-detalle__fish" src="${asset('svg/pez.svg')}" alt="" aria-hidden="true" />
        </div>
      </div>`;
    app.appendChild(this.el);
    this.img = this.el.querySelector('.foto-detalle__fig img');
    this.nEl = this.el.querySelector('[data-n]');
    // no ✕ — clicking anywhere except the text columns closes; ESC also closes
    this.el.addEventListener('click', (e) => { if (!e.target.closest('.foto-detalle__cols')) this.close(); });
    this._onKey = (e) => { if (e.key === 'Escape') this.close(); };
    this._inlineRama();
  }

  async _inlineRama() {
    try { this.el.querySelector('[data-rama]').innerHTML = await (await fetch(asset('svg/ramas-izq.svg'))).text(); }
    catch { /* keep empty */ }
  }

  open(photo) {
    this.img.src = photo.url || photo.src?.full || '';
    this.nEl.textContent = photo.n || '12';
    this.el.hidden = false;
    document.addEventListener('keydown', this._onKey);
    gsap.fromTo(this.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
    gsap.fromTo(this.el.querySelector('.foto-detalle__fig'),
      { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', delay: 0.05 });
  }

  close() {
    document.removeEventListener('keydown', this._onKey);
    gsap.to(this.el, { autoAlpha: 0, duration: 0.3, onComplete: () => { this.el.hidden = true; } });
  }
}
