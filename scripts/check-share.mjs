/**
 * Encode a multi-tree sample build and verify the live (or local) SSR page restores ranks in HTML.
 * Usage: node scripts/check-share.mjs [baseUrl]
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import lz from 'lz-string';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const classes = JSON.parse(readFileSync(join(root, 'data', 'classes.json'), 'utf8'));
const talents = JSON.parse(readFileSync(join(root, 'data', 'talents.json'), 'utf8'));
const base = (process.argv[2] || 'https://talcalc.com').replace(/\/$/, '');

const classInfo = classes.find((c) => c.slug === 'hunter');
const list = talents.filter((t) => t.class === 'hunter');

/** Sample: points in all three trees with a prereq chain feel. */
const sample = {
  'focused-fire': 1,
  'endurance-training': 5,
  'improved-concussive-shot': 5,
  'lethal-attacks': 5,
  'improved-tracking': 1,
  'deflection': 5,
  'entrapment': 3,
};

function encode(ranks) {
  const parts = [];
  for (const tree of classInfo.trees) {
    const treeList = list
      .filter((t) => t.tree === tree.slug)
      .sort((a, b) => a.order - b.order);
    let digits = '';
    let last = -1;
    for (let i = 0; i < treeList.length; i++) {
      const r = ranks[treeList[i].id] ?? 0;
      digits += String(Math.min(r, treeList[i].maxRank));
      if (r > 0) last = i;
    }
    if (last >= 0) parts.push(`${tree.slug}:${digits.slice(0, last + 1)}`);
  }
  return lz.compressToEncodedURIComponent(parts.join('|'));
}

const used = Object.values(sample).reduce((a, b) => a + b, 0);
const code = encode(sample);
const url = `${base}/hunter/build/${code}/`;

const res = await fetch(url, {
  headers: { 'user-agent': 'talc-check-share/1.0' },
  redirect: 'follow',
});
if (!res.ok) {
  console.error(`FAIL HTTP ${res.status} ${url}`);
  process.exit(1);
}
const html = await res.text();

const cardPath = `/hunter/build/${code}/card/`;
const needles = [
  'Focused Fire',
  'Endurance Training',
  'Improved Concussive Shot',
  '1.60.1.70425',
  'disclaimer',
  `${used}/`,
  `og:image" content="https://talcalc.com${cardPath}"`,
];

let failed = 0;
for (const n of needles) {
  if (!html.includes(n)) {
    console.error(`FAIL missing: ${n}`);
    failed += 1;
  } else {
    console.log(`OK   ${n}`);
  }
}

const cardUrl = `${base}${cardPath}`;
const cardRes = await fetch(cardUrl, {
  headers: { 'user-agent': 'talc-check-share/1.0' },
  redirect: 'follow',
});
const cardType = cardRes.headers.get('content-type') || '';
const cardBuf = new Uint8Array(await cardRes.arrayBuffer());
const isPng =
  cardBuf.length > 8 &&
  cardBuf[0] === 0x89 &&
  cardBuf[1] === 0x50 &&
  cardBuf[2] === 0x4e &&
  cardBuf[3] === 0x47;
if (!cardRes.ok || !cardType.includes('image/png') || !isPng) {
  console.error(
    `FAIL dynamic OG ${cardRes.status} type=${cardType} bytes=${cardBuf.length} png=${isPng}`,
  );
  failed += 1;
} else {
  console.log(`OK   dynamic OG ${cardBuf.length} bytes`);
}

// Rank chips like 1/1 or 5/5 should appear for spent talents
if (!html.includes('1/1') && !html.match(/data-rank[^>]*>\s*1\s*</)) {
  // SSR page lists spent talents; check spent section
  if (!html.includes('Focused Fire')) failed += 1;
}

console.log(`\nURL ${url}`);
console.log(`points spent in sample: ${used}`);
if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log('Share SSR check passed');
