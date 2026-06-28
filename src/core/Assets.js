/**
 * Loads the optimized image manifest produced by scripts/optimize-images.mjs
 * and exposes helpers to pull curated subsets for each section.
 */
let _manifest = [];

/** Prefix a public-asset path with the deploy base so it works under a subpath
 *  (e.g. GitHub Pages at /TFG_WEB_TRUTTA/). Accepts paths with or without a slash. */
export const asset = (p) => import.meta.env.BASE_URL + String(p).replace(/^\/+/, '');

export async function loadManifest() {
  try {
    const res = await fetch(asset('img/manifest.json'));
    _manifest = await res.json();
    // make the photo URLs base-aware too (manifest stores them as /img/…)
    _manifest.forEach((m) => {
      if (m.src?.full) m.src.full = asset(m.src.full);
      if (m.src?.thumb) m.src.thumb = asset(m.src.thumb);
    });
  } catch {
    console.warn('[Assets] manifest.json no encontrado — ejecuta `npm run optimize:img`');
    _manifest = [];
  }
  return _manifest;
}

export function all() { return _manifest; }

/** Loads the hand-drawn guide line path `d` from public/svg/guide.svg (cached). */
let _guideD;
export async function guidePath() {
  if (_guideD !== undefined) return _guideD;
  try {
    const txt = await (await fetch(asset('svg/guide.svg'))).text();
    const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
    _guideD = doc.querySelector('path')?.getAttribute('d') || null;
  } catch {
    _guideD = null;
  }
  return _guideD;
}

/** River photos only (excludes screenshots / AI-generated / misc). */
export function rivers() {
  return _manifest.filter(m => /^(img-\d+|alberche)/.test(m.id));
}

/** Photos of a named group (= source subfolder, lowercased), ordered by the
 *  trailing number in the filename (vertical_1 → 1) for curated fixed slots. */
export function group(name, { thumb = false } = {}) {
  const num = (id) => +(id.match(/\d+/g)?.pop() ?? 0);
  return _manifest
    .filter((m) => m.group === name)
    .sort((a, b) => num(a.id) - num(b.id))
    .map((m) => ({ ...m, url: thumb ? m.src.thumb : m.src.full }));
}

/** A single photo by its manifest id (or null), url resolved to full/thumb. */
export function byId(id, { thumb = false } = {}) {
  const m = _manifest.find((x) => x.id === id);
  return m ? { ...m, url: thumb ? m.src.thumb : m.src.full } : null;
}

/** A shuffled pool of N photos for trails / chaos grids. */
export function pool(n = 12, { thumb = false } = {}) {
  const list = rivers().length ? rivers() : _manifest;
  const shuffled = [...list].sort(() => Math.random() - 0.5).slice(0, n);
  return shuffled.map(m => ({ ...m, url: thumb ? m.src.thumb : m.src.full }));
}
