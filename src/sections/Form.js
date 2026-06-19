/**
 * FORM (Desktop 7) — "Comparte tu experiencia" overlay.
 * Uploader (3–6 images), Nombre*, Localización*, Mensaje. On submit it validates,
 * builds ObjectURLs for the local files and hands a new bitácora to onSubmit().
 */
import { gsap } from 'gsap';

const MIN = 3, MAX = 6;

export class Form {
  constructor(app, { onSubmit, onClose } = {}) {
    this.onSubmit = onSubmit;
    this.onClose = onClose;
    this.files = [];
    this.el = document.createElement('div');
    this.el.className = 'form-overlay';
    this.el.hidden = true;
    this.el.innerHTML = `
      <div class="form-overlay__head">
        <button class="form__back" type="button">
          <span class="form__back-arrow" aria-hidden="true">←</span>
          <span data-i18n="form_back">VOLVER A LA PÁGINA PRINCIPAL</span>
        </button>
      </div>
      <form class="form" novalidate>
        <label class="form__drop">
          <input type="file" accept="image/*" multiple hidden>
          <span class="form__plus">+</span>
          <span class="form__drop-label" data-i18n="form_add">AÑADIR FOTOGRAFÍAS</span>
        </label>
        <div class="form__thumbs" aria-live="polite"></div>
        <div class="form__fields">
          <label class="form__field">
            <span class="form__label"><span data-i18n="form_name">NOMBRE</span> <i>*</i></span>
            <input name="nombre" type="text" placeholder="LOREM IPSUM DOLOR" required>
          </label>
          <label class="form__field">
            <span class="form__label"><span data-i18n="form_loc">LOCALIZACIÓN</span> <i>*</i></span>
            <input name="lugar" type="text" placeholder="LOREM IPSUM DOLOR" required>
          </label>
          <label class="form__field form__field--msg">
            <span class="form__label" data-i18n="form_msg">AÑADIR MENSAJE</span>
            <textarea name="mensaje" placeholder="LOREM IPSUM DOLOR" rows="4"></textarea>
          </label>
          <p class="form__error" hidden></p>
          <button class="btn-fill form__submit" type="submit" data-i18n="form_send">ENVIAR</button>
        </div>
      </form>`;
    app.appendChild(this.el);

    this.form = this.el.querySelector('form');
    this.input = this.el.querySelector('input[type=file]');
    this.thumbs = this.el.querySelector('.form__thumbs');
    this.error = this.el.querySelector('.form__error');

    this.el.querySelector('.form__back').addEventListener('click', () => this._back());
    this.input.addEventListener('change', () => this._addFiles(this.input.files));
    this.form.addEventListener('submit', (e) => this._submit(e));
    this._onKey = (e) => { if (e.key === 'Escape') this._back(); };
    this._renderThumbs();
  }

  _addFiles(fileList) {
    for (const f of fileList) {
      if (!f.type.startsWith('image/')) continue;
      if (this.files.length >= MAX) break;
      this.files.push({ file: f, url: URL.createObjectURL(f) });
    }
    this.input.value = '';
    this._renderThumbs();
  }

  _renderThumbs() {
    // show 5 slots by default (cleaner), growing to 6 only if the user maxes out
    let html = '';
    const slots = Math.max(4, this.files.length);
    for (let i = 0; i < slots; i++) {
      const f = this.files[i];
      html += f
        ? `<div class="form__thumb"><img src="${f.url}" alt="">
             <button type="button" class="form__thumb-x" data-i="${i}" aria-label="Quitar">✕</button></div>`
        : `<div class="form__thumb form__thumb--empty"></div>`;
    }
    this.thumbs.innerHTML = html;
    this.thumbs.querySelectorAll('.form__thumb-x').forEach(btn =>
      btn.addEventListener('click', () => this._remove(+btn.dataset.i)));
    if (this.files.length) this._setError('');
  }

  _remove(i) {
    URL.revokeObjectURL(this.files[i].url);
    this.files.splice(i, 1);
    this._renderThumbs();
  }

  _setError(msg) { this.error.textContent = msg; this.error.hidden = !msg; }

  _submit(e) {
    e.preventDefault();
    const data = new FormData(this.form);
    const nombre = (data.get('nombre') || '').trim();
    const lugar = (data.get('lugar') || '').trim();
    if (!nombre || !lugar) return this._setError('Nombre y localización son obligatorios.');
    if (this.files.length < MIN || this.files.length > MAX)
      return this._setError(`Añade entre ${MIN} y ${MAX} imágenes (ahora: ${this.files.length}).`);

    this.onSubmit?.({
      author: nombre.toUpperCase(),
      place: lugar,
      message: (data.get('mensaje') || '').trim() || 'Sin mensaje.',
      images: this.files.map(f => ({ url: f.url })),
    });
    // ownership of the ObjectURLs passes to Bitácoras; reset without revoking
    this.files = [];
    this.form.reset();
    this._renderThumbs();
    this.close();
  }

  open() {
    this.el.hidden = false;
    document.addEventListener('keydown', this._onKey);
    gsap.fromTo(this.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
    gsap.fromTo(this.form, { y: 24, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', delay: 0.05 });
  }

  close() {
    document.removeEventListener('keydown', this._onKey);
    this._setError('');
    gsap.to(this.el, { autoAlpha: 0, duration: 0.3, onComplete: () => { this.el.hidden = true; } });
  }

  /** "Volver a la página principal" → close and return to the Bitácoras section. */
  _back() { this.close(); this.onClose?.(); }
}
