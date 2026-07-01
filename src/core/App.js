/**
 * App — boots the background, loads assets, wires the state machine and sections.
 */
import { gsap } from 'gsap';
import { RippleBackground } from '../background/RippleBackground.js';
import { StateMachine } from './StateMachine.js';
import { loadManifest } from './Assets.js';
import { Landing } from '../sections/Landing.js';
import { ArchivosVivos } from '../sections/ArchivosVivos.js';
import { FotoDetalle } from '../sections/FotoDetalle.js';
import { Bitacoras } from '../sections/Bitacoras.js';
import { Form } from '../sections/Form.js';
import { applyLang, getLang, toggleLang } from './i18n.js';
import { FloatField } from './FloatField.js';

export class App {
  async init() {
    window.__app = this; // debug handle
    window.__gsap = gsap; // debug handle
    const appEl = document.getElementById('app');

    // 1) background
    this.ripple = new RippleBackground(document.getElementById('ripple'));
    await this.ripple.init();

    // 2) assets
    await loadManifest();

    // 3) overlay + global "click any photo to open the detail" delegation
    this.detalle = new FotoDetalle(appEl);
    const onPhotoClick = (photo) => this.detalle.open(photo);
    appEl.addEventListener('click', (e) => {
      const img = e.target.closest('img');
      if (!img) return;
      // skip brand/chrome imagery; only real photos open the overlay
      if (img.closest('.site-header, .site-footer, .banner__rama, .banner__trail, .banner__bg, .form-overlay, .foto-detalle, .rama')) return;
      const url = img.dataset.full || img.currentSrc || img.src || '';
      if (!/\/img\/|^blob:/.test(url)) return;
      this.detalle.open({ url, n: img.dataset.n });
    });

    // 4) state machine (declared before sections that reference it)
    this.fsm = new StateMachine({}, {
      onChange: (name) => { document.body.dataset.state = name; this._syncFloat?.(); },
    });

    // 5) sections
    this.landing = new Landing(appEl, {
      onStart: (rio) => { this.rio = rio || 'lozoya'; this.fsm.go('video'); },
    });
    this.flow = new ArchivosVivos(appEl, {
      ripple: this.ripple, fsm: this.fsm, onPhotoClick,
    });

    // bitácoras carousel (lives inside the landing scroll) + share form overlay
    const toBitacoras = () => {
      const go = this.fsm.currentName === 'landing' ? Promise.resolve() : this.fsm.go('landing');
      Promise.resolve(go).then(() => requestAnimationFrame(() =>
        this.landing.root.querySelector('#bitacoras')?.scrollIntoView({ behavior: 'smooth' })));
    };
    this.form = new Form(appEl, {
      onSubmit: (entry) => { this.bitacoras.add(entry); toBitacoras(); },
      onClose: toBitacoras,
    });
    this.bitacoras = new Bitacoras(this.landing.root.querySelector('#bitacoras'), {
      onShareClick: () => this.form.open(),
    });

    // floating-on-water motion for the whole site's objects, with an on-screen
    // toggle (rooted at #app so it reaches every section, not just the landing)
    this.float = new FloatField(appEl);
    this._setupFloat();

    // 6) register states
    Object.assign(this.fsm.states, {
      landing: {
        enter: () => { this.ripple.setTone('light'); return this.landing.enter(); },
        exit: () => this.landing.exit(),
      },
      ...this.flow.states(),
    });

    // 7) nav — TRUTTA→top · ARCHIVO→Archivos Vivos · EXPERIENCIAS→Bitácoras
    const goLanding = async (id) => {
      if (this.detalle && !this.detalle.el.hidden) this.detalle.close();
      if (this.fsm.currentName !== 'landing') await this.fsm.go('landing');
      requestAnimationFrame(() => {
        const el = id && this.landing.root.querySelector('#' + id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    };
    // hamburger (mobile): toggle the nav dropdown; any nav action also closes it
    const header = document.querySelector('.site-header');
    const burger = document.querySelector('.site-header__burger');
    const closeMenu = () => {
      header.classList.remove('nav-open');
      burger?.setAttribute('aria-expanded', 'false');
    };
    burger?.addEventListener('click', () => {
      const open = header.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', String(open));
    });

    document.querySelectorAll('.site-header__nav button').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('site-header__lang')) { toggleLang(); return; }
        closeMenu();
        const t = btn.dataset.goto;
        if (t === 'landing') goLanding(null);
        else if (t === 'archivo') goLanding('archivos');
        else if (t === 'experiencias') goLanding('bitacoras');
        // manifiesto: not wired yet
      });
    });

    // measure the (multiline) navbar so overlays can clear it
    const setHeaderVar = () => document.documentElement.style.setProperty('--header-real', header.offsetHeight + 'px');
    setHeaderVar();
    window.addEventListener('resize', setHeaderVar);

    // 8) language (Spanish default) + reveal immediately, then start the flow
    applyLang(getLang());
    gsap.set('body', { autoAlpha: 1 });
    await this.fsm.go('landing');
  }

  /* ---- "Desactivar animaciones" panic button ---- */
  _setupFloat() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saved = localStorage.getItem('trutta-nomotion');
    // motion ON by default; OFF if saved as off, or if the OS asks for reduced motion
    this._motionOn = saved !== null ? saved !== '1' : !reduce;

    const btn = document.createElement('button');
    btn.className = 'float-toggle';
    btn.type = 'button';
    document.body.appendChild(btn);
    this._floatBtn = btn;

    const render = () => {
      const label = this._motionOn ? 'Desactivar animaciones' : 'Activar animaciones';
      btn.setAttribute('aria-pressed', String(!this._motionOn));
      btn.setAttribute('aria-label', label);          // full text for screen readers (collapsed)
      btn.setAttribute('title', label);
      btn.classList.toggle('is-off', !this._motionOn);
      btn.innerHTML = `<span class="float-toggle__wave" aria-hidden="true">≈</span>
        <span class="float-toggle__label">${label}</span>`;
    };
    btn.addEventListener('click', () => {
      this._motionOn = !this._motionOn;
      try { localStorage.setItem('trutta-nomotion', this._motionOn ? '0' : '1'); } catch { /* ignore */ }
      render();
      this._applyMotion();
    });
    render();
    this._applyMotion();
  }

  /** Freeze/unfreeze every motion (float + ripple + CSS via .no-motion). */
  _applyMotion() {
    document.body.classList.toggle('no-motion', !this._motionOn);
    if (this._motionOn) this.ripple?.resume?.();
    else this.ripple?.pause?.();
    this._syncFloat();
  }

  /** Run the float across every section while motion is on (the field re-collects
      its targets on each section/overlay swap, so it follows the whole site). */
  _syncFloat() {
    if (!this.float) return;
    if (this._motionOn) this.float.start();
    else this.float.stop();
  }
}
