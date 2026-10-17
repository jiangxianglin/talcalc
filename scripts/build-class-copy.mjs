/**
 * Build data/class-copy.json for all nine classes from data/*.json only.
 * Numbers, talent names, and change examples come from talents + meta — never invented.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const meta = JSON.parse(readFileSync(join(root, 'data', 'meta.json'), 'utf8'));
const classes = JSON.parse(readFileSync(join(root, 'data', 'classes.json'), 'utf8'));
const talents = JSON.parse(readFileSync(join(root, 'data', 'talents.json'), 'utf8'));

function formatCheckedLong(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function examples(list, change, n = 3) {
  return list.filter((t) => t.change === change).slice(0, n).map((t) => t.name);
}

function joinNames(names) {
  if (!names.length) return 'none listed in this dataset';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function treeSplitLabel(trees) {
  // Short labels for “X-heavy” wording — tree names from data only.
  return trees.map((t) => {
    const first = t.name.split(/\s+/)[0];
    return `${first}-heavy`;
  });
}

function buildFigures(slug, name, trees) {
  const dir = join(root, 'public', 'images', slug);
  const points = join(dir, `${slug}-points-diagram.jpg`);
  const ncm = join(dir, `${slug}-ncm-legend.jpg`);
  if (!existsSync(points) || !existsSync(ncm)) return undefined;

  const treeList = trees.map((t) => t.name).join(', ');
  return [
    {
      src: `/images/${slug}/${slug}-points-diagram.jpg`,
      alt: `WoW Forever ${name} talent calculator point rules: ${meta.totalPoints} points shared across ${treeList} with a ${meta.rowGate}-point row gate`,
      caption: `${meta.totalPoints} points are shared across the three ${name} trees. Within one tree, every ${meta.rowGate} points spent unlocks the next row.`,
    },
    {
      src: `/images/${slug}/${slug}-ncm-legend.jpg`,
      alt: `Change marks on the WoW Forever ${name} talent calculator compared to Classic: N new, C changed, M moved`,
      caption: `N / C / M marks compare each ${name} talent to Classic Era in our dataset. Hover a mark in the calculator for the short label.`,
    },
  ];
}

function buildClassCopy(classInfo, siblings) {
  const list = talents.filter((t) => t.class === classInfo.slug);
  const stats = { new: 0, changed: 0, moved: 0, unchanged: 0 };
  const treeCounts = classInfo.trees.map((tree) => ({
    name: tree.name,
    slug: tree.slug,
    count: list.filter((t) => t.tree === tree.slug).length,
  }));
  for (const t of list) stats[t.change] = (stats[t.change] || 0) + 1;

  const checked = formatCheckedLong(meta.checkedAt);
  const treeNames = classInfo.trees.map((t) => t.name);
  const treeCountsPhrase = treeCounts.map((t) => `${t.count} in ${t.name}`).join(', ');
  const treeCountsSlash = treeCounts.map((t) => t.count).join(' / ');
  const heavy = treeSplitLabel(classInfo.trees);
  const newEx = examples(list, 'new');
  const chEx = examples(list, 'changed');
  const mvEx = examples(list, 'moved');
  const siblingPhrase = siblings.map((s) => s.name).join(' and ');

  const copy = {
    intro: `This is a free ${classInfo.name} talent calculator for World of Warcraft®: Forever™. Open the full ${treeNames[0]}, ${treeNames[1]}, and ${treeNames[2]} trees, spend all ${meta.totalPoints} points under Forever rules, then copy a share link. Talent names and every rank description are read from client build ${meta.clientBuild}, checked ${checked}.`,
    sections: [
      {
        heading: `How ${classInfo.name} talent points work in Forever`,
        paragraphs: [
          `At level ${meta.levelCap} you have ${meta.totalPoints} talent points. Those points are one shared pool across ${treeNames[0]}, ${treeNames[1]}, and ${treeNames[2]} — not ${meta.totalPoints} per tree.`,
          `Inside a single tree, spending ${meta.rowGate} points unlocks the next row. Locked rows stay grey until that gate is met. Talents also respect maxRank (1–5) and prerequisite links: you cannot rank a talent until its requirement is filled.`,
          'The calculator blocks overspend. Used and remaining points update as you click.',
        ],
      },
      {
        heading: `${treeNames[0]}, ${treeNames[1]}, and ${treeNames[2]} trees`,
        paragraphs: [
          `This page lists ${classInfo.talentCount} ${classInfo.name} talents in our dataset: ${treeCountsPhrase}. Every name and rank text is prerendered in the HTML so you (and crawlers) can read them without running the interactive grid.`,
          `Use the trees above to try ${heavy[0]}, ${heavy[1]}, or ${heavy[2]} splits. Nothing on this page claims a single “correct” PvE or PvP build — that would need live tuning data we do not invent.`,
        ],
      },
      {
        heading: `What changed for ${classInfo.name} vs Classic?`,
        paragraphs: [
          `Against Classic Era in our diff file, ${classInfo.name} shows ${stats.new} new talents, ${stats.changed} changed, ${stats.moved} moved, and ${stats.unchanged} unchanged. Examples of new nodes include ${joinNames(newEx)}. Changed examples include ${joinNames(chEx)}. Moved examples include ${joinNames(mvEx)}.`,
          `Open the change list on this page for the full crawlable set, or open an individual talent page for every rank description. Counts come from data/talents.json for class ${classInfo.slug} — not from competitor pages.`,
          'When the client build moves, check the beta changelog for what we rebuilt.',
        ],
      },
      {
        heading: `Plan, save, and share a ${classInfo.name} build`,
        paragraphs: [
          `Each point you spend updates the address bar. Copy that URL, or use Copy link, to restore the same ranks in another browser via a real path under /${classInfo.slug}/build/ — not a hash fragment.`,
          'Drafts also stay in local storage on this device (clearing site data removes them). Reset and undo are available in the calculator chrome when you need to restart a theorycraft pass. Talc cannot import or export an in-game talent string — plan here, then apply ranks in the client yourself.',
          `If you are comparing classes before locking a main, the home hub links all nine calculators, including ${siblingPhrase} beside ${classInfo.name}.`,
        ],
      },
    ],
    faqs: [
      {
        q: `How many ${classInfo.name} talents are in Forever?`,
        a: `This calculator lists ${classInfo.talentCount} ${classInfo.name} talents across ${treeNames.join(', ')} (${treeCountsSlash}), read from client build ${meta.clientBuild}, checked ${checked}.`,
      },
      {
        q: `How do ${classInfo.name} talent points work?`,
        a: `At level ${meta.levelCap} you have ${meta.totalPoints} points shared across all three trees. Within one tree, each new row opens after ${meta.rowGate} points spent in that tree. Prerequisites and maxRank still apply.`,
      },
      {
        q: `What changed for ${classInfo.name} vs Classic?`,
        a: `In our dataset, ${classInfo.name} has ${stats.new} new, ${stats.changed} changed, ${stats.moved} moved, and ${stats.unchanged} unchanged talents versus Classic Era. The change list on this page links every marked talent.`,
      },
      {
        q: `Does Talc pick the best ${classInfo.name} build?`,
        a: 'No. Talc is a planning tool. It does not publish unverified BiS, DPS rankings, or leveling presets. Spend points on the trees, then share your own link.',
      },
      {
        q: 'Where is my draft saved, and can I import a game build?',
        a: 'Drafts stay in this browser’s local storage on this device. Clearing cookies or site data removes them. Share links restore ranks on any browser. Talc cannot import talent strings from the game client.',
      },
      {
        q: 'Is Talc official, and do I need an account?',
        a: 'Talc is an unofficial fan-made tool, not affiliated with Blizzard. It is free and does not require an account.',
      },
    ],
  };

  const figures = buildFigures(classInfo.slug, classInfo.name, classInfo.trees);
  if (figures) copy.figures = figures;
  return copy;
}

const out = {};
for (let i = 0; i < classes.length; i++) {
  const c = classes[i];
  const siblings = [classes[(i + 1) % classes.length], classes[(i + 2) % classes.length]];
  out[c.slug] = buildClassCopy(c, siblings);
}

const path = join(root, 'data', 'class-copy.json');
writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log(`Wrote ${path} (${Object.keys(out).length} classes)`);
