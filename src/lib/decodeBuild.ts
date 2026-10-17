import { decompressUri } from './lz';
import type { ClassInfo, RankMap, Talent } from './types';
import { getTalentsForTree } from './data';
import { emptyRanks } from './encodeBuild';

export function decodeBuild(
  code: string | undefined,
  classSlug: string,
  classInfo: ClassInfo,
  talents: Talent[],
): RankMap | null {
  if (!code) return emptyRanks(talents);
  const raw = decompressUri(code);
  if (!raw) return null;

  const ranks = emptyRanks(talents);
  const treeBySlug = new Map(classInfo.trees.map((t) => [t.slug, t]));

  for (const part of raw.split('|')) {
    const colon = part.indexOf(':');
    if (colon <= 0) continue;
    const treeSlug = part.slice(0, colon);
    const digits = part.slice(colon + 1);
    if (!treeBySlug.has(treeSlug)) continue;
    const list = getTalentsForTree(classSlug, treeSlug);
    for (let i = 0; i < list.length; i++) {
      const ch = digits[i];
      if (ch === undefined) break;
      const n = Number(ch);
      if (!Number.isFinite(n) || n < 0) continue;
      ranks[list[i].id] = Math.min(n, list[i].maxRank);
    }
  }
  return ranks;
}

export function pointsInTree(
  talents: Talent[],
  ranks: RankMap,
  treeSlug: string,
): number {
  let sum = 0;
  for (const t of talents) {
    if (t.tree === treeSlug) sum += ranks[t.id] ?? 0;
  }
  return sum;
}

export function totalPointsUsed(ranks: RankMap): number {
  return Object.values(ranks).reduce((a, b) => a + b, 0);
}

export function canAddPoint(
  talent: Talent,
  ranks: RankMap,
  talents: Talent[],
  totalPoints: number,
  rowGate: number,
): { ok: boolean; reason?: string } {
  const current = ranks[talent.id] ?? 0;
  if (current >= talent.maxRank) return { ok: false, reason: 'Max rank reached' };

  const used = totalPointsUsed(ranks);
  if (used >= totalPoints) return { ok: false, reason: 'No points left' };

  const treePoints = pointsInTree(talents, ranks, talent.tree);
  if (treePoints < talent.pointsRequired) {
    return {
      ok: false,
      reason: `Needs ${talent.pointsRequired} points in this tree first (${rowGate} per row)`,
    };
  }

  const reqs = talent.requiresAny?.length
    ? talent.requiresAny
    : talent.requires
      ? [talent.requires]
      : [];

  if (reqs.length) {
    const satisfied = reqs.some((id) => {
      const req = talents.find((t) => t.id === id);
      if (!req) return false;
      return (ranks[id] ?? 0) >= req.maxRank;
    });
    if (!satisfied) {
      const names = reqs
        .map((id) => talents.find((t) => t.id === id)?.name)
        .filter(Boolean)
        .join(' or ');
      return { ok: false, reason: `Requires ${names} maxed` };
    }
  }

  return { ok: true };
}

export function canRemovePoint(
  talent: Talent,
  ranks: RankMap,
  talents: Talent[],
): { ok: boolean; reason?: string } {
  const current = ranks[talent.id] ?? 0;
  if (current <= 0) return { ok: false, reason: 'Nothing to remove' };

  const next = { ...ranks, [talent.id]: current - 1 };

  // Removing must not leave dependents or break row gates for spent talents
  for (const t of talents) {
    const r = next[t.id] ?? 0;
    if (r <= 0) continue;
    if (t.tree !== talent.tree) continue;

    const treePts = pointsInTree(talents, next, t.tree);
    if (treePts < t.pointsRequired) {
      return { ok: false, reason: `Would break row gate for ${t.name}` };
    }

    const reqs = t.requiresAny?.length
      ? t.requiresAny
      : t.requires
        ? [t.requires]
        : [];
    if (reqs.length) {
      const ok = reqs.some((id) => {
        const req = talents.find((x) => x.id === id);
        if (!req) return false;
        return (next[id] ?? 0) >= req.maxRank;
      });
      if (!ok) return { ok: false, reason: `Required by ${t.name}` };
    }
  }

  return { ok: true };
}
