/**
 * Post-build smoke checks from AGENTS.md §11 — fail if HTML is hollow.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const checks = [
  {
    file: 'index.html',
    needles: [
      '1.60.1.70425',
      'Improved Heroic Strike',
      'disclaimer',
      'WoW Forever Talent Calculator',
      'Where is my draft saved?',
      'How often is the talent data updated?',
      'Dataset',
      'creativecommons.org/licenses/by/4.0/',
      '/talents/',
      '/patch-notes/',
    ],
  },
  {
    file: 'warrior/index.html',
    needles: [
      'Improved Heroic Strike',
      'Reduces the cost of your Heroic Strike',
      'Mortal Strike',
      'WoW Forever Warrior Talent Calculator',
      'How many Warrior talents are in Forever?',
      'Dataset',
      '1.60.1.70425',
    ],
  },
  {
    file: 'hunter/index.html',
    needles: ['WoW Forever Hunter Talent Calculator', 'Focused Fire', 'How many Hunter talents are in Forever?'],
  },
  {
    file: 'shaman/index.html',
    needles: ['WoW Forever Shaman Talent Calculator', 'Lava Burst'],
  },
  { file: 'mage/talents/pyroblast/index.html', needles: ['Pyroblast'] },
  {
    file: 'beta/index.html',
    needles: ['1.60.1.70425', 'October 21', '/stress-test/', '/name-reservation/', '1:00 p.m. PDT'],
  },
  {
    file: 'stress-test/index.html',
    needles: [
      'October 21',
      'previously October 19',
      'no subscription',
      'Name Reservations',
      'FAQPage',
      'Warrior talent calculator',
      'disclaimer',
    ],
  },
  {
    file: 'talents/index.html',
    needles: ['All 466 talents', 'Improved Heroic Strike', '/warrior/talents/'],
  },
  {
    file: 'patch-notes/index.html',
    needles: [
      'Class deep dives',
      'news.blizzard.com',
      '/stress-test/',
      'Priest and Warrior',
      'claim-your-world-of-warcraft-forever-character-names',
      '/name-reservation/',
    ],
  },
  {
    file: 'name-reservation/index.html',
    needles: [
      'October 27',
      'November 3',
      '18:00 CET',
      '1:00 p.m. PDT',
      'across all Rulesets',
      'Skyborne Heroic Pack',
      'two-name',
      'FAQPage',
      'Warrior talent calculator',
      'disclaimer',
      'claim-your-world-of-warcraft-forever-character-names',
    ],
  },
  {
    file: 'sitemap-0.xml',
    needles: [
      'https://talcalc.com/stress-test/',
      'https://talcalc.com/talents/',
      'https://talcalc.com/patch-notes/',
      'https://talcalc.com/name-reservation/',
    ],
  },
  {
    file: 'robots.txt',
    needles: ['Sitemap: https://talcalc.com/sitemap-index.xml', 'GPTBot', 'Allow: /'],
  },
  {
    file: 'llms.txt',
    needles: [
      'talcalc.com',
      'https://talcalc.com/hunter/',
      'https://talcalc.com/stress-test/',
      'https://talcalc.com/talents/',
      'https://talcalc.com/patch-notes/',
      'https://talcalc.com/name-reservation/',
    ],
  },
  { file: '_routes.json', needles: ['/*/build/*'] },
  { file: 'sitemap-index.xml', needles: ['sitemap'] },
];

let failed = 0;
for (const c of checks) {
  const path = join(dist, c.file);
  if (!existsSync(path)) {
    console.error(`MISSING ${c.file}`);
    failed += 1;
    continue;
  }
  const html = readFileSync(path, 'utf8');
  for (const n of c.needles) {
    if (!html.includes(n)) {
      console.error(`FAIL ${c.file} — missing: ${n}`);
      failed += 1;
    } else {
      console.log(`OK   ${c.file} — ${n}`);
    }
  }
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll HTML checks passed');
