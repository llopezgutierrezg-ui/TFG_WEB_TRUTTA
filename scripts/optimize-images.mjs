/**
 * Image optimization pipeline.
 * Reads the heavy source photos (12–21 MB JPGs) from _raw_assets/Fotografias,
 * emits web-ready WebP at two sizes into public/img, and writes a manifest.json
 * the app consumes. Run: npm run optimize:img
 */
import { readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import { join, extname, basename, relative } from 'node:path';
import sharp from 'sharp';

const SRC_DIR = join(process.cwd(), '_raw_assets', 'Fotografias');
const OUT_DIR = join(process.cwd(), 'public', 'img');

const SIZES = [
  { suffix: 'full', width: 1600, quality: 80 }, // grid / detail
  { suffix: 'thumb', width: 640, quality: 72 },  // trail / carousel small
];
const VALID = new Set(['.jpg', '.jpeg', '.png']);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (VALID.has(extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

function slug(srcPath) {
  return relative(SRC_DIR, srcPath)
    .replace(/\\/g, '/')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  let files;
  try {
    files = await walk(SRC_DIR);
  } catch {
    console.error(`\n✖ No encuentro ${SRC_DIR}.\n  Descomprime Fotografías.zip ahí primero.\n`);
    process.exit(1);
  }

  const manifest = [];
  let i = 0;
  for (const file of files) {
    const id = slug(file);
    const meta = await sharp(file).metadata();
    const aspect = +(meta.width / meta.height).toFixed(4);
    // group = top-level source subfolder (lowercased), or 'rio' if loose. Derive
    // it from the path BEFORE slugifying (slug() strips the '/').
    const relPath = relative(SRC_DIR, file).replace(/\\/g, '/');
    const grp = relPath.includes('/') ? relPath.split('/')[0].toLowerCase() : 'rio';
    const entry = { id, aspect, group: grp, src: {} };
    for (const s of SIZES) {
      const outName = `${id.replace(/\//g, '_')}-${s.suffix}.webp`;
      await sharp(file)
        .rotate()
        .resize({ width: s.width, withoutEnlargement: true })
        .webp({ quality: s.quality })
        .toFile(join(OUT_DIR, outName));
      entry.src[s.suffix] = `/img/${outName}`;
    }
    manifest.push(entry);
    i++;
    process.stdout.write(`\r  optimizando ${i}/${files.length}…`);
  }

  await writeFile(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const totalOut = (await Promise.all(
    (await readdir(OUT_DIR)).map(f => stat(join(OUT_DIR, f)).then(s => s.size))
  )).reduce((a, b) => a + b, 0);
  console.log(`\n✔ ${manifest.length} fotos → ${(totalOut / 1e6).toFixed(1)} MB en /public/img (manifest.json incluido)`);
}

run();
