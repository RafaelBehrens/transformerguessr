#!/usr/bin/env node
// Pre-crops each card from the gallery PNG into its own PNG, padded with
// white to a uniform size. Run: `node crop_cards.js`

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'architecture-gallery-hero-backup.png');
const MODELS_JSON = path.join(ROOT, 'models.json');
const OUT_DIR = path.join(ROOT, 'cards');

if (!fs.existsSync(SRC)) { console.error(`Missing: ${SRC}`); process.exit(1); }
if (!fs.existsSync(MODELS_JSON)) { console.error(`Missing: ${MODELS_JSON}`); process.exit(1); }

const data = JSON.parse(fs.readFileSync(MODELS_JSON, 'utf8'));
const boxes = (data.boxes || []).filter(b => b.name && b.name.trim());

if (boxes.length === 0) { console.error('No named boxes in models.json.'); process.exit(1); }

fs.mkdirSync(OUT_DIR, { recursive: true });

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

const manifest = [];
for (const b of boxes) {
  const slug = slugify(b.name);
  const out = path.join(OUT_DIR, `${slug}.png`);

  // Crop using the exact x, y, w, h from the labeler — no offsets, no padding.
  execSync(`sips --cropOffset ${b.y} ${b.x} --cropToHeightWidth ${b.h} ${b.w} "${SRC}" --out "${out}"`,
    { stdio: ['ignore', 'ignore', 'ignore'] });

  manifest.push({ name: b.name, slug, file: `cards/${slug}.png`, w: b.w, h: b.h });
  console.log(`  ✓ ${slug}.png (${b.w}×${b.h})`);
}

fs.writeFileSync(path.join(ROOT, 'cards.manifest.json'),
  JSON.stringify({ cards: manifest }, null, 2));

console.log(`\nCropped ${boxes.length} cards using labeled x/y/w/h.`);
console.log(`Output: cards/ (+ cards.manifest.json)`);
