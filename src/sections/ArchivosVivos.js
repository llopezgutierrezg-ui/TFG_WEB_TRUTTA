/**
 * ARCHIVOS VIVOS — the strict cinematic state flow.
 *
 *  Fase 1 (auto):  video (D8) --ended--> textoA (D15) --3s--> textoB (D16) --3s--> fase2
 *  Fase 2 (scroll): D11 apartados. Chaotic photos lerp into the Figma grid (D4)
 *                   while an SVG guide line draws (D6). Line hits 100% exactly
 *                   when photos snap home; only then is the next apartado unlocked.
 *  Fase 3:          two CTAs — "Volver a empezar" / "Volver al index".
 *
 * Returns a map of FSM states bound to a shared root + the background tone.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { pool, asset } from '../core/Assets.js';

gsap.registerPlugin(ScrollTrigger);

const DELAY = 3; // seconds for textoA / textoB

export class ArchivosVivos {
  constructor(app, { ripple, fsm, onPhotoClick }) {
    this.app = app;
    this.ripple = ripple;
    this.fsm = fsm;
    this.onPhotoClick = onPhotoClick;
    this.root = document.createElement('section');
    this.root.className = 'state state--dark state--flow';
    this.root.id = 'recorrido';
    this.root.hidden = true;
    app.appendChild(this.root);
    this._timers = [];
  }

  _clearTimers() { this._timers.forEach(clearTimeout); this._timers = []; }
  _show() { this.root.hidden = false; }

  // expose FSM states
  states() {
    return {
      video: { enter: () => this._video(), exit: () => this._exitGeneric() },
      textoA: { enter: () => this._texto('A'), exit: () => this._exitGeneric() },
      textoB: { enter: () => this._texto('B'), exit: () => this._exitGeneric() },
      fase2: { enter: () => this._fase2(), exit: () => this._exitFase2() },
    };
  }

  _exitGeneric() {
    this._clearTimers();
    return gsap.to(this.root, { autoAlpha: 0, duration: 0.4 })
      .then(() => { this.root.innerHTML = ''; this.root.hidden = true; gsap.set(this.root, { autoAlpha: 1 }); });
  }

  /* ---------- Fase 1 ---------- */
  _video() {
    this.ripple?.setTone('dark');
    this.root.className = 'state state--dark state--flow';
    this._show();
    this.root.innerHTML = `
      <video class="flow__video" src="${asset('video/placeholder.mp4')}"
             autoplay muted playsinline></video>
      <button class="flow__skip" type="button">SALTAR ▸</button>`;
    const video = this.root.querySelector('.flow__video');
    const next = () => this.fsm.go('textoA');
    video.addEventListener('ended', next, { once: true });
    this.root.querySelector('.flow__skip').addEventListener('click', next, { once: true });
    video.play?.().catch(() => {}); // some browsers need the explicit call
    return gsap.fromTo(this.root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 });
  }

  _texto(which) {
    this.ripple?.setTone('dark');
    this._show();
    if (which === 'A') {
      this.root.className = 'state state--dark state--flow';
      this.root.innerHTML = `<div class="flow__texto"><h2 class="u-handwritten flow__lozoya">LO<br>ZO<br>YA</h2></div>`;
    } else {
      // Desktop 16 — manifiesto: fish + statement bottom-left, date bottom-right
      this.root.className = 'state state--dark';
      this.root.innerHTML = `
        <div class="manifiesto">
          <div class="manifiesto__main">
            <img class="manifiesto__fish" src="${asset('svg/pez.svg')}" alt="" aria-hidden="true" />
            <div class="manifiesto__text">
              <p class="manifiesto__lead">No somos una plataforma de turismo rural ni un destino de ocio.
              Somos una barrera arquitectónica, una aduana conductual y una advertencia institucional.</p>
              <p class="manifiesto__body">TRUTTA utiliza el diseño industrial, la tipografía normativa y la
              señalética de impacto cero para auditar el estado biológico de los ríos de la España Vaciada.
              Operamos mediante la fricción estética: oponemos el rigor matemático de nuestro sistema visual al
              caos orgánico del ecosistema para desactivar la inercia del turismo masivo. Nuestro objetivo no es
              atraer flujos de personas, sino exigir silencio, contención absoluta y respeto en zonas de extrema
              fragilidad. Certificamos la pureza del agua documentando el rastro de sus bioindicadores para
              garantizar que el paisaje sobreviva a la huella humana.</p>
            </div>
          </div>
          <img class="manifiesto__date" src="${asset('svg/fecha.svg')}" alt="2026" />
        </div>`;
    }
    this._timers.push(setTimeout(
      () => this.fsm.go(which === 'A' ? 'textoB' : 'fase2'),
      DELAY * 1000,
    ));
    return gsap.fromTo(this.root.firstElementChild,
      { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' });
  }

  /* ---------- Fase 2 — 4 apartados secuenciales (Group 24 / Desktop 6) ----------
     Each apartado: black title card → white scene where its 5 photos go from
     chaos to a magnetic stack while the Figma guide line draws. The line hits
     100% exactly as the stack settles; reaching that point = end of the
     apartado's pinned scroll, which naturally unlocks the next one. */
  async _fase2() {
    this.ripple?.setTone('light');
    this.root.className = 'state state--apartados';
    this._show();

    const APARTADOS = ['EL ORIGEN', 'EL UMBRAL', 'EL CAUCE', 'DESENLACE'];
    const allPhotos = pool(20, { thumb: false }); // 5 per apartado → "FOTO x/20"

    this.root.innerHTML = APARTADOS.map((name, i) => this._apartadoMarkup(i, name)).join('');

    this._sts = [];
    APARTADOS.forEach((name, i) => {
      const photos = allPhotos.slice(i * 5, i * 5 + 5);
      this._wireApartado(i, photos, i === APARTADOS.length - 1);
    });

    ScrollTrigger.refresh();
    return gsap.fromTo(this.root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 });
  }

  _apartadoMarkup(i, name) {
    return `
      <section class="apartado" data-i="${i}">
        <div class="apartado__pin">
          <div class="apartado__title">
            <span class="apartado__num u-handwritten">0${i + 1}</span>
            <h2 class="apartado__name">${name}</h2>
          </div>
          <div class="apartado__scene">
            <aside class="apartado__col apartado__col--l"></aside>
            <div class="apartado__stack"></div>
            <aside class="apartado__col apartado__col--r"></aside>
          </div>
        </div>
      </section>`;
  }

  /* Depth scroller: the 5 photos sit on a vertical axis; the one nearest the
     centre is largest & sharpest, neighbours shrink/fade toward the top & bottom
     edges. Scrolling moves the active photo through the column, and the side
     columns crossfade to show *that* photo's caption. The guide line draws in
     parallel and completes at p = 1. */
  _wireApartado(i, photos, isLast) {
    const section = this.root.querySelector(`.apartado[data-i="${i}"]`);
    const pin = section.querySelector('.apartado__pin');
    const title = section.querySelector('.apartado__title');
    const scene = section.querySelector('.apartado__scene');
    const stack = section.querySelector('.apartado__stack');
    const colL = section.querySelector('.apartado__col--l');
    const colR = section.querySelector('.apartado__col--r');

    const DESC = `La trucha común (Salmo trutta) es el organismo indicador más fiable para
      evaluar la salud de los ecosistemas acuáticos de aguas frías. Su presencia confirma
      condiciones de suspensión excepcional y ausencia de contaminantes.`;

    // designed "chaos" disposition (Desktop 19): centre offsets (vw/vh) + base width (vw)
    const CHAOS = [
      { x: -20.3, y:   4.0, w: 24.8 }, // big, centre-left
      { x: -36.5, y: -24.8, w: 16.3 }, // left, up
      { x:  12.6, y: -19.5, w: 26.7 }, // centre-right, up
      { x:  14.7, y:  25.3, w: 35.4 }, // right, down
      { x:  50.8, y:  14.5, w: 19.0 }, // far right
      { x: -48.5, y:  41.9, w: 16.3 }, // far left, down
    ];
    const DEPTH_H = 20; // ordered-column photo height (vw) — normalised so the stack is even
    const tiles = photos.map((p, k) => {
      const el = document.createElement('button');
      el.className = 'apartado__ph';
      el.innerHTML = `<img src="${p.url}" data-full="${p.src?.full || p.url}" data-n="${i * 5 + k + 1}" alt="">`;
      stack.appendChild(el);
      const c = CHAOS[k % CHAOS.length];
      const aspect = p.aspect || 1.5; // keep each photo's real proportion (vertical stays vertical)
      el.style.width = c.w + 'vw';
      el.style.aspectRatio = String(aspect);
      gsap.set(el, { left: '50%', top: '50%', xPercent: -50, yPercent: -50 });
      return {
        el, photo: p, n: i * 5 + k + 1, chaos: c,
        depthNorm: (DEPTH_H * aspect) / c.w, // scale so every photo is DEPTH_H tall when ordered
      };
    });

    gsap.set(scene, { autoAlpha: 0 });

    const N = tiles.length;
    let lastActive = -1;
    const setCaption = (k) => {
      if (k === lastActive) return;
      lastActive = k;
      colL.innerHTML = `<p class="foto-tag">FOTO ${tiles[k].n}/20</p>`;
      colR.innerHTML = `<p class="foto-desc">${DESC}</p>`;
      gsap.fromTo([colL, colR], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, overwrite: true });
    };

    const clamp = gsap.utils.clamp;
    const lerp = gsap.utils.interpolate;
    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=2600',
      pin,
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        // black title card → white scene
        gsap.set(title, { autoAlpha: 1 - clamp(0, 1, (p - 0.04) / 0.12) });
        gsap.set(scene, { autoAlpha: clamp(0, 1, (p - 0.10) / 0.12) });
        // phase 1: chaos → ordered column   phase 2: depth scroll through photos
        const orderP = clamp(0, 1, (p - 0.16) / 0.20);
        const scrollP = clamp(0, 1, (p - 0.36) / 0.64);
        const active = scrollP * (N - 1);
        const vw = window.innerWidth, vh = window.innerHeight;
        const spacing = vw * 0.18; // vertical step in the ordered column
        tiles.forEach((t, k) => {
          const d = k - active;
          // size is the main cue: shrink strongly toward the edges, fade only slightly
          const falloff = Math.max(0.34, 1 - Math.abs(d) * 0.32);
          const depthScale = t.depthNorm * falloff;
          const depthAlpha = Math.max(0.55, 1 - Math.abs(d) * 0.16);
          gsap.set(t.el, {
            x: lerp(t.chaos.x / 100 * vw, 0, orderP),
            y: lerp(t.chaos.y / 100 * vh, d * spacing, orderP),
            rotation: 0,
            scale: lerp(1, depthScale, orderP),
            autoAlpha: lerp(1, depthAlpha, orderP),
            zIndex: Math.round(100 - Math.abs(d) * 10),
          });
        });
        setCaption(Math.round(clamp(0, N - 1, active)));
        if (isLast) this._toggleEndCTAs(p > 0.96);
      },
    });
    this._sts.push(st);
  }

  _toggleEndCTAs(show) {
    let end = this.root.querySelector('.apartado__end');
    if (show && !end) {
      end = document.createElement('div');
      end.className = 'apartado__end';
      end.innerHTML = `
        <button class="btn-line" data-act="restart">VOLVER A EMPEZAR</button>
        <button class="btn-line" data-act="index">VOLVER AL INDEX</button>`;
      this.root.querySelector('.apartado[data-i="3"] .apartado__pin').appendChild(end);
      end.querySelector('[data-act="restart"]').addEventListener('click', () => this.fsm.go('video'));
      end.querySelector('[data-act="index"]').addEventListener('click', () => this.fsm.go('landing'));
      gsap.fromTo(end, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5 });
    } else if (!show && end) {
      gsap.to(end, { autoAlpha: 0, duration: 0.3, onComplete: () => end.remove() });
    }
  }

  _exitFase2() {
    (this._sts || []).forEach(st => st.kill());
    ScrollTrigger.getAll().forEach(st => st.kill());
    this._sts = [];
    window.scrollTo(0, 0);
    return this._exitGeneric();
  }
}
