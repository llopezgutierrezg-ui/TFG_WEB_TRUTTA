/**
 * RippleBackground — global GPU "water" layer.
 *
 * Strategy (option A, adapted to a flat B&W design):
 *  - A single fixed Pixi/WebGL canvas sits behind all content (#ripple).
 *  - Sections render with transparent backgrounds, so this layer *is* the
 *    page background. It paints the current tone (light/dark) plus a faint
 *    noise field, and a DisplacementFilter warps that noise around the cursor.
 *  - The pointer feeds 2 uniforms only (position + decaying strength), so JS
 *    does ~0 work per frame and there is zero layout thrashing — all GPU.
 *  - Driven by gsap.ticker so Pixi and GSAP share one clock (no rAF war).
 *
 * If WebGL is unavailable it degrades silently to a CSS background color.
 */
import {
  Application, Container, Graphics, Sprite, Texture,
  DisplacementFilter, TilingSprite,
} from 'pixi.js';
import { gsap } from 'gsap';

const TONES = {
  light: 0xffffff,
  dark: 0x000000,
};

function makeNoiseTexture(size = 160) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 120 + Math.random() * 135;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return Texture.from(c);
}

function makeDisplacementTexture(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, '#808080');
  g.addColorStop(1, '#808080');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(c);
}

export class RippleBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.app = null;
    this.ok = false;
    this._tone = { value: 0 };        // 0 = light, 1 = dark (tweenable)
    this._pointer = { x: -9999, y: -9999, strength: 0 };
  }

  async init() {
    try {
      this.app = new Application();
      await this.app.init({
        canvas: this.canvas,
        resizeTo: window,
        backgroundAlpha: 0,
        antialias: false,
        preference: 'webgl',
        powerPreference: 'high-performance',
        autoStart: false,        // we drive rendering manually from gsap.ticker
        sharedTicker: false,     // avoid Pixi's own rAF loop (no "rAF war")
      });
    } catch (e) {
      console.warn('[Ripple] WebGL no disponible, fallback CSS.', e);
      document.body.style.background = 'var(--c-bg)';
      return;
    }

    const { width, height } = this.app.screen;

    // Tone layers: white base + black overlay whose alpha = tone.
    this.base = new Graphics().rect(0, 0, width, height).fill(0xffffff);
    this.darkBase = new Graphics().rect(0, 0, width, height).fill(0x000000);
    this.darkBase.alpha = 0;

    // Faint noise field — this is what visibly ripples.
    this.noise = new TilingSprite({
      texture: makeNoiseTexture(),
      width, height,
    });
    this.noise.tileScale.set(3);
    this.noise.alpha = 0.05;

    this.mood = new Container();
    this.mood.addChild(this.base, this.darkBase, this.noise);

    // Displacement driver following the pointer.
    this.disp = new Sprite(makeDisplacementTexture());
    this.disp.anchor.set(0.5);
    this.disp.scale.set(1.4);
    this.disp.position.set(-9999, -9999);

    this.filter = new DisplacementFilter({ sprite: this.disp, scale: 0 });
    this.mood.filters = [this.filter];

    this.app.stage.addChild(this.mood, this.disp);

    this._bind();
    this._loop = this._loop.bind(this);
    gsap.ticker.add(this._loop);
    this.ok = true;
    this._running = true;
  }

  pause() {
    if (!this.ok || !this._running) return;
    gsap.ticker.remove(this._loop);
    this._running = false;
  }

  resume() {
    if (!this.ok || this._running) return;
    gsap.ticker.add(this._loop);
    this._running = true;
  }

  _bind() {
    this._onMove = (e) => {
      this._pointer.x = e.clientX;
      this._pointer.y = e.clientY;
      // bump strength, then let it decay in the loop
      gsap.to(this._pointer, { strength: 1, duration: 0.25, ease: 'power2.out', overwrite: true });
    };
    window.addEventListener('pointermove', this._onMove, { passive: true });

    this._onResize = () => {
      const { width, height } = this.app.screen;
      this.base.clear().rect(0, 0, width, height).fill(0xffffff);
      this.darkBase.clear().rect(0, 0, width, height).fill(0x000000);
      this.noise.width = width; this.noise.height = height;
    };
    window.addEventListener('resize', this._onResize);
  }

  _loop() {
    if (!this.ok && !this.app) return;
    // ease displacement sprite toward pointer
    this.disp.x += (this._pointer.x - this.disp.x) * 0.12;
    this.disp.y += (this._pointer.y - this.disp.y) * 0.12;
    // decay strength
    this._pointer.strength *= 0.94;
    const s = 14 + this._pointer.strength * 36;
    this.filter.scale.x = s;   // v8: scale is a read-only Point — set components
    this.filter.scale.y = s;
    // idle drift so it breathes even without input
    this.noise.tilePosition.x += 0.15;
    this.noise.tilePosition.y += 0.08;
    this.darkBase.alpha = this._tone.value;
    // single render pass (Pixi autoStart is off)
    this.app.renderer.render({ container: this.app.stage });
  }

  /** Cross-fade the background tone for a given state. */
  setTone(tone = 'light', duration = 0.8) {
    const target = tone === 'dark' ? 1 : 0;
    gsap.to(this._tone, { value: target, duration, ease: 'power2.inOut' });
  }

  destroy() {
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('resize', this._onResize);
    gsap.ticker.remove(this._loop);
    this.app?.destroy(true);
  }
}
