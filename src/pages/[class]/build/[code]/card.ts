export const prerender = false;

import type { APIRoute } from 'astro';
import { getClass, getTalentsForClass, meta } from '../../../../lib/data';
import { decodeBuild, pointsInTree, totalPointsUsed } from '../../../../lib/decodeBuild';
import { renderBuildOgPng } from '../../../../lib/buildOgPng';

export const GET: APIRoute = async ({ params }) => {
  const slug = params.class;
  const code = params.code;
  if (!slug || !code) {
    return new Response('Not found', { status: 404 });
  }

  const classInfo = getClass(slug);
  if (!classInfo) {
    return new Response('Not found', { status: 404 });
  }

  const talents = getTalentsForClass(slug);
  const ranks = decodeBuild(code, slug, classInfo, talents);
  if (!ranks) {
    return new Response('Not found', { status: 404 });
  }

  const used = totalPointsUsed(ranks);
  const dist = classInfo.trees.map((t) => pointsInTree(talents, ranks, t.slug));
  const distLabel = dist.join('/');
  const treeLabels = classInfo.trees.map((t, i) => `${t.name} ${dist[i]}`);
  const highlightNames = talents
    .filter((t) => (ranks[t.id] ?? 0) > 0)
    .sort((a, b) => (ranks[b.id] ?? 0) - (ranks[a.id] ?? 0) || a.order - b.order)
    .slice(0, 3)
    .map((t) => `${t.name} ${ranks[t.id]}/${t.maxRank}`);

  const png = await renderBuildOgPng({
    className: classInfo.name,
    accentHex: classInfo.accent || '#c9a96e',
    distLabel,
    used,
    totalPoints: meta.totalPoints,
    treeLabels,
    highlightNames,
  });

  return new Response(png, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
};
