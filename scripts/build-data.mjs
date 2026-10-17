/**
 * Transform wow-forever.gg developers/talents.json (CC BY 4.0) into
 * data/meta.json, data/classes.json, data/talents.json for Talc.
 *
 * Optional Classic diff overlay: data/raw-talent-changes.csv
 * (class,talent,status,changes) — maps to N / C / M markers.
 *
 * Attribution (required): Talent trees and statistics from WoW Forever,
 * https://wow-forever.gg (CC BY 4.0)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(readFileSync(join(root, 'data', 'raw-talents.json'), 'utf8'));

function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function treeSlug(name) {
  return slugify(name);
}

/** Minimal CSV parser (handles quoted fields). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\r') {
      // skip
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function loadClassicDiffs() {
  const path = join(root, 'data', 'raw-talent-changes.csv');
  if (!existsSync(path)) return new Map();
  const rows = parseCsv(readFileSync(path, 'utf8'));
  if (!rows.length) return new Map();
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const iClass = header.indexOf('class');
  const iTalent = header.indexOf('talent');
  const iStatus = header.indexOf('status');
  const iChanges = header.indexOf('changes');
  const map = new Map(); // `${classSlug}:${talentSlug}` -> { change, changeNote }

  for (const r of rows.slice(1)) {
    const className = r[iClass]?.trim();
    const talentName = r[iTalent]?.trim();
    const status = (r[iStatus] || '').trim().toLowerCase();
    const changes = (r[iChanges] || '').trim().toLowerCase();
    if (!className || !talentName || status === 'removed') continue;

    let change = 'unchanged';
    if (status === 'new') change = 'new';
    else if (status === 'changed') {
      change = changes.includes('position') ? 'moved' : 'changed';
    } else if (status === 'same') {
      change = 'unchanged';
    }

    const noteParts = [];
    if (changes) noteParts.push(changes);
    const key = `${slugify(className)}:${slugify(talentName)}`;
    map.set(key, {
      change,
      changeNote: noteParts.length ? `vs Classic: ${noteParts.join(', ')}` : undefined,
    });
  }
  return map;
}

const classicDiffs = loadClassicDiffs();

const usedSlugs = new Map();

function uniqueTalentId(classSlug, name) {
  const base = slugify(name);
  if (!usedSlugs.has(classSlug)) usedSlugs.set(classSlug, new Set());
  const set = usedSlugs.get(classSlug);
  let id = base;
  let n = 2;
  while (set.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  set.add(id);
  return id;
}

const CLASS_ORDER = [
  'warrior',
  'paladin',
  'hunter',
  'rogue',
  'priest',
  'shaman',
  'mage',
  'warlock',
  'druid',
];

const INTROS = {
  warrior:
    'Plan Arms, Fury, and Protection builds for WoW: Forever™. Spend all 51 points across the three trees, then copy a share link.',
  paladin:
    'Plan Holy, Protection, and Retribution builds for WoW: Forever™. Spend all 51 points across the three trees, then copy a share link.',
  hunter:
    'Free Hunter talent calculator for WoW: Forever™ — full Beast Mastery, Marksmanship, and Survival trees. Spend all 51 points, compare Classic marks, then copy a share link.',
  rogue:
    'Plan Assassination, Combat, and Subtlety builds for WoW: Forever™. Spend all 51 points across the three trees, then copy a share link.',
  priest:
    'Plan Discipline, Holy, and Shadow builds for WoW: Forever™. Spend all 51 points across the three trees, then copy a share link.',
  shaman:
    'Plan Elemental, Enhancement, and Restoration builds for WoW: Forever™. Spend all 51 points across the three trees, then copy a share link.',
  mage:
    'Plan Arcane, Fire, and Frost builds for WoW: Forever™. Spend all 51 points across the three trees, then copy a share link.',
  warlock:
    'Plan Affliction, Demonology, and Destruction builds for WoW: Forever™. Spend all 51 points across the three trees, then copy a share link.',
  druid:
    'Plan Balance, Feral, and Restoration builds for WoW: Forever™. Spend all 51 points across the three trees, then copy a share link.',
};

/** Accent colors for class chrome (not game data — UI only). */
const ACCENTS = {
  warrior: '#C79C6E',
  paladin: '#F58CBA',
  hunter: '#ABD473',
  rogue: '#FFF569',
  priest: '#FFFFFF',
  shaman: '#0070DE',
  mage: '#69CCF0',
  warlock: '#9482C9',
  druid: '#FF7D0A',
};

const talents = [];
const classes = [];
const idByNumeric = new Map();

for (const cls of raw.classes) {
  for (const tree of cls.trees) {
    for (const t of tree.talents) {
      if (!t.name) continue;
      const slug = uniqueTalentId(cls.slug, t.name);
      idByNumeric.set(`${cls.slug}:${t.id}`, slug);
    }
  }
}

let totalTalents = 0;
const changeCounts = { new: 0, changed: 0, moved: 0, unchanged: 0, unmatched: 0 };

for (const cls of raw.classes) {
  const treesMeta = [];
  for (const tree of cls.trees) {
    const tSlug = treeSlug(tree.name);
    treesMeta.push({
      id: tree.id,
      slug: tSlug,
      name: tree.name,
      rows: tree.rows,
      columns: tree.columns,
    });

    tree.talents.forEach((t, order) => {
      if (!t.name) return;
      const id = idByNumeric.get(`${cls.slug}:${t.id}`);
      const requires =
        Array.isArray(t.requires) && t.requires.length
          ? t.requires
              .map((rid) => idByNumeric.get(`${cls.slug}:${rid}`))
              .filter(Boolean)
          : undefined;

      const diff = classicDiffs.get(`${cls.slug}:${id}`);
      let change = 'unchanged';
      let changeNote;
      if (diff) {
        change = diff.change;
        changeNote = diff.changeNote;
      } else if (classicDiffs.size) {
        changeCounts.unmatched += 1;
      }
      changeCounts[change] = (changeCounts[change] || 0) + 1;

      const row = {
        id,
        numericId: t.id,
        name: t.name,
        class: cls.slug,
        tree: tSlug,
        treeId: tree.id,
        order,
        row: t.row + 1,
        col: t.column,
        maxRank: t.max_ranks,
        pointsRequired: t.points_required,
        icon: String(t.icon_id),
        spellId: t.spell_id,
        requires: requires?.length ? requires[0] : undefined,
        requiresAny: requires && requires.length > 1 ? requires : undefined,
        change,
        ranks: Array.isArray(t.description) ? t.description : [],
      };
      if (changeNote) row.changeNote = changeNote;
      talents.push(row);
      totalTalents += 1;
    });
  }

  const count = talents.filter((x) => x.class === cls.slug).length;
  classes.push({
    id: cls.id,
    slug: cls.slug,
    name: cls.name,
    trees: treesMeta,
    talentCount: count,
    accent: ACCENTS[cls.slug] || '#e07a3a',
    intro: INTROS[cls.slug] || `Plan ${cls.name} talent builds for WoW: Forever™.`,
  });
}

classes.sort((a, b) => CLASS_ORDER.indexOf(a.slug) - CLASS_ORDER.indexOf(b.slug));

const meta = {
  clientBuild: raw.build,
  checkedAt: raw.generated,
  source: 'wow-forever.gg developers export (CC BY 4.0)',
  sourceUrl: 'https://wow-forever.gg/developers/',
  attribution:
    'Talent trees and statistics from WoW Forever, https://wow-forever.gg (CC BY 4.0)',
  classicDiffSource: classicDiffs.size
    ? 'data/raw-talent-changes.csv (status/position vs Classic Era)'
    : null,
  levelCap: 60,
  totalPoints: raw.points_at_level_60,
  rowGate: 5,
  totalTalents,
  changeCounts: {
    new: changeCounts.new,
    changed: changeCounts.changed,
    moved: changeCounts.moved,
    unchanged: changeCounts.unchanged,
  },
  levelsThatGrantPoint: raw.levels_that_grant_a_point,
};

mkdirSync(join(root, 'data'), { recursive: true });
writeFileSync(join(root, 'data', 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
writeFileSync(join(root, 'data', 'classes.json'), JSON.stringify(classes, null, 2) + '\n');
writeFileSync(join(root, 'data', 'talents.json'), JSON.stringify(talents, null, 2) + '\n');

// Refresh beta entry counts from this build
const betaPath = join(root, 'data', 'beta.json');
const beta = {
  entries: [
    {
      clientBuild: meta.clientBuild,
      checkedAt: meta.checkedAt,
      summary: `Dataset for client build ${meta.clientBuild}: ${totalTalents} talents across nine classes. Classic Era markers applied where the change CSV matches by class + talent name.`,
      added: changeCounts.new,
      changed: changeCounts.changed + changeCounts.moved,
      removed: 0,
      notes: [
        'Source: wow-forever.gg developers export (CC BY 4.0).',
        meta.classicDiffSource
          ? `Classic markers: ${changeCounts.new} new, ${changeCounts.changed} changed, ${changeCounts.moved} moved, ${changeCounts.unchanged} unchanged (${changeCounts.unmatched} unmatched names left as unchanged).`
          : 'Classic Era diff CSV not present — all talents marked unchanged.',
      ],
    },
  ],
};
writeFileSync(betaPath, JSON.stringify(beta, null, 2) + '\n');

console.log(
  `Built ${totalTalents} talents · build ${meta.clientBuild} · N/C/M`,
  meta.changeCounts,
  changeCounts.unmatched ? `(unmatched ${changeCounts.unmatched})` : '',
);
