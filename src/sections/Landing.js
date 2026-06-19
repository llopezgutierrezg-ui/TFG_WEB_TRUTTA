/**
 * LANDING (Desktop 17) — the long-scroll index.
 *
 *  1. Banner: kicker + TRUTTA over a river photo, with a mouse-trail of images
 *     and white sketch line-art.
 *  2. Intro paragraph + scattered photos.
 *  3. ARCHIVOS VIVOS: two river expositions (01 Lozoya, 02 Alberche), each with
 *     an "INICIAR RECORRIDO" button that launches the cinematic flow.
 *  4. Bitácoras teaser + footer.
 *
 * onStart(rio) is fired by a river's CTA to kick off the recorrido.
 */
import { gsap } from 'gsap';
import { pool, rivers, asset } from '../core/Assets.js';

const TRAIL_SIZE = 16;
const SPAWN_DIST = 90;

export class Landing {
  constructor(app, { onStart }) {
    this.onStart = onStart;
    this.root = document.createElement('section');
    this.root.className = 'state state--landing';
    this.root.id = 'landing';
    this.root.hidden = true;
    this._last = { x: 0, y: 0 };
    this._i = 0;
    app.appendChild(this.root);
    this._build();
  }

  _build() {
    // fixed hero photo (deterministic — doesn't change on reload)
    const river0 = rivers()[0];
    const banner = river0 ? { ...river0, url: river0.src.full } : pool(1)[0];
    const intro = pool(7, { thumb: true });
    const lozoya = pool(6, { thumb: true });
    const alberche = pool(6, { thumb: true });

    this.root.innerHTML = `
      <div class="banner">
        <div class="banner__trail" aria-hidden="true"></div>
        <img class="banner__bg" src="${banner?.url || ''}" alt="" />
        <span class="banner__rama banner__rama--l rama" data-rama="izq" aria-hidden="true"></span>
        <span class="banner__rama banner__rama--r rama" data-rama="der" aria-hidden="true"></span>
        <div class="banner__head">
          <span class="banner__kicker" data-i18n="banner_kicker">SISTEMA DE ARCHIVO DOCUMENTAL</span>
          <img class="banner__logo-main" src="${asset('svg/logo-trutta.svg')}" alt="TRUTTA" />
        </div>
      </div>

      <section class="intro">
        <span class="intro__rama intro__rama--l rama" data-rama="izq" aria-hidden="true"></span>
        <span class="intro__rama intro__rama--r rama" data-rama="der" aria-hidden="true"></span>
        <div class="intro__photos">
          ${intro.map((p, i) => `<img class="intro__ph intro__ph--${i}" src="${p.url}" data-full="${p.src?.full || p.url}" alt="">`).join('')}
        </div>
        <p class="intro__lead" data-i18n="intro_lead">
          UN RECORRIDO INMERSIVO POR LOS RÍOS DE LA ESPAÑA VACÍA.
          TRUTTA EXPLORA LA TENSIÓN ENTRE EL RIGOR CIENTÍFICO Y LA NATURALEZA
          INDOMABLE, DEJANDO UN RASTRO AZUL SOBRE LO QUE ESTAMOS A PUNTO DE PERDER.
        </p>
      </section>

      <section class="archivos" id="archivos">
        <h2 class="archivos__title u-handwritten" data-i18n="archivos_title">ARCHIVOS VIVOS</h2>
        <p class="archivos__sub" data-i18n="archivos_sub">Registro documental de ecosistemas bajo vigilancia institucional.</p>

        ${this._expo('01', 'LOZOYA', 'lozoya', lozoya)}
        ${this._expo('02', 'ALBERCHE', 'alberche', alberche)}
      </section>

      <section class="bitacoras" id="bitacoras"></section>

      <footer class="site-footer">
        <div class="site-footer__claim-row">
          <img class="site-footer__fish" src="${asset('svg/pez.svg')}" alt="" aria-hidden="true" />
          <p class="site-footer__claim u-handwritten" data-i18n="footer_claim">DISEÑO PARA<br>CONSERVAR LO QUE FLUYE</p>
        </div>
        <div class="site-footer__dark">
          <img class="site-footer__logo" src="${asset('svg/logo-trutta.svg')}" alt="TRUTTA" />
          <div class="site-footer__mid">
            <nav class="site-footer__links">
              <a href="#">For designers</a>
              <a href="#">Articles</a>
              <a href="#">Contacts</a>
            </nav>
            <div class="site-footer__contact">
              <p class="site-footer__col-h">CONTACT US</p>
              <p>+1 891 989-11-91</p>
              <p>info@logoipsum.com</p>
            </div>
          </div>
          <div class="site-footer__meta">
            <p class="site-footer__copy">© 2023 — Copyright</p>
            <div class="site-footer__social">
              <a href="#">Instagram</a>
              <a href="#">Whatsapp</a>
              <a href="#">Telegram</a>
            </div>
          </div>
        </div>
      </footer>
    `;

    this.trail = this.root.querySelector('.banner__trail');
    this._buildTrail();

    this.root.querySelectorAll('.expo__cta').forEach(btn => {
      btn.addEventListener('click', () => this.onStart?.(btn.closest('.expo').dataset.rio));
    });

    this._inlineRamas();
    this._onMove = this._onMove.bind(this);
  }

  /* Inline the rama SVGs so CSS can render them as outline-only line-art
     (stroke = currentColor, no fill) — white over the banner, dark over the
     intro — matching Figma. */
  async _inlineRamas() {
    const cache = {};
    const get = async (n) => (cache[n] ??= await (await fetch(asset(`svg/ramas-${n}.svg`))).text());
    for (const el of this.root.querySelectorAll('[data-rama]')) {
      try { el.innerHTML = await get(el.dataset.rama); } catch { /* keep empty */ }
    }
  }

  _expo(num, name, rio, photos) {
    const cap = name.charAt(0) + name.slice(1).toLowerCase();
    const place = rio === 'lozoya' ? 'Buitrago del Lozoya' : 'el valle del Tiétar';
    const basin = rio === 'lozoya'
      ? 'afluente del Jarama en la Comunidad de Madrid'
      : 'afluente del Tajo entre Ávila y Toledo';
    const nameLines = (name.match(/.{1,2}/g) || [name]).join('<br>');
    // Exact Figma layout (Frame 268: 1383×1579) — photos absolutely placed,
    // text in container-relative units so it scales with the frame.
    return `
      <article class="expo" data-rio="${rio}">
        <div class="expo__frame">
          ${photos.map((p, i) => `<img class="expo__ph expo__ph--${i}" src="${p.url}" data-full="${p.src?.full || p.url}" alt="">`).join('')}
          <div class="expo__text">
            <span class="expo__num u-handwritten">${num}</span>
            <div class="expo__block">
              <h3 class="expo__heading">${name} <span class="expo__vol">"VOLUMEN 0"</span></h3>
              <p class="expo__desc-short">La exposición que nos sumerge en la historia del río ${cap}
                y su estrecha relación con el pueblo de ${place}.</p>
              <p class="expo__desc">La trucha común (Salmo trutta) es el organismo indicador más confiable
                para evaluar la salud de ecosistemas acuáticos de aguas frías. Su presencia confirma condiciones
                de oxigenación excepcional, temperatura estable y ausencia total de contaminantes orgánicos o
                metales pesados. El río ${cap}, ${basin}, representa uno de los últimos refugios de pureza hídrica
                absoluta en la Península Ibérica. Este expediente documenta su estado prístino a través de su
                habitante más exigente.</p>
            </div>
          </div>
          <div class="expo__name u-handwritten">${nameLines}</div>
          <button class="expo__cta btn-fill" data-i18n="expo_cta">INICIAR RECORRIDO</button>
        </div>
      </article>`;
  }

  _buildTrail() {
    this.imgs = [];
    const photos = pool(TRAIL_SIZE, { thumb: true });
    for (let i = 0; i < TRAIL_SIZE; i++) {
      const img = document.createElement('img');
      img.className = 'banner__trail-img';
      img.src = photos[i % photos.length]?.url || '';
      img.alt = '';
      gsap.set(img, { autoAlpha: 0, scale: 0.6, xPercent: -50, yPercent: -50 });
      this.trail.appendChild(img);
      this.imgs.push(img);
    }
  }

  _onMove(e) {
    // trail only over the banner area
    const banner = this.root.querySelector('.banner');
    const rect = banner.getBoundingClientRect();
    if (e.clientY > rect.bottom) return;
    const dx = e.clientX - this._last.x;
    const dy = e.clientY - this._last.y;
    if (Math.hypot(dx, dy) < SPAWN_DIST) return;
    this._last = { x: e.clientX, y: e.clientY };
    const img = this.imgs[this._i++ % this.imgs.length];
    gsap.killTweensOf(img);
    gsap.set(img, { x: e.clientX, y: e.clientY, autoAlpha: 1, scale: 1, rotation: 0 });
    gsap.to(img, { autoAlpha: 0, scale: 0.92, y: e.clientY + 26, duration: 1.1, ease: 'power2.out' });
  }

  enter() {
    this.root.hidden = false;
    window.scrollTo(0, 0);
    window.addEventListener('pointermove', this._onMove, { passive: true });
    return gsap.fromTo(this.root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 });
  }

  exit() {
    window.removeEventListener('pointermove', this._onMove);
    return gsap.to(this.root, { autoAlpha: 0, duration: 0.4 })
      .then(() => { this.root.hidden = true; gsap.set(this.root, { autoAlpha: 1 }); });
  }
}
