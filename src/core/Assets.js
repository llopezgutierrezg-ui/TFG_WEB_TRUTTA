/**
 * Loads the optimized image manifest produced by scripts/optimize-images.mjs
 * and exposes helpers to pull curated subsets for each section.
 */
let _manifest = [];

export async function loadManifest() {
  try {
    const res = await fetch('/img/manifest.json');
    _manifest = await res.json();
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
    const txt = await (await fetch('/svg/guide.svg')).text();
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

/** A shuffled pool of N photos for trails / chaos grids. */
export function pool(n = 12, { thumb = false } = {}) {
  const list = rivers().length ? rivers() : _manifest;
  const shuffled = [...list].sort(() => Math.random() - 0.5).slice(0, n);
  return shuffled.map(m => ({ ...m, url: thumb ? m.src.thumb : m.src.full }));
}
