import { compressUri } from './lz';
import type { ClassInfo, RankMap, Talent } from './types';
import { getTalentsForTree } from './data';

/** Compact ranks string per tree (file order), then LZ → URI-safe. */
export function encodeBuild(
  classSlug: string,
  ranks: RankMap,
  classInfo: ClassInfo,
): string {
  const parts: string[] = [];
  for (const tree of classInfo.trees) {
    const list = getTalentsForTree(classSlug, tree.slug);
    let digits = '';
    let lastNonZero = -1;
    for (let i = 0; i < list.length; i++) {
      const r = ranks[list[i].id] ?? 0;
      digits += String(Math.min(r, list[i].maxRank));
      if (r > 0) lastNonZero = i;
    }
    if (lastNonZero < 0) continue;
    parts.push(`${tree.slug}:${digits.slice(0, lastNonZero + 1)}`);
  }
  if (parts.length === 0) return '';
  return compressUri(parts.join('|'));
}

export function buildPath(classSlug: string, code: string): string {
  return code ? `/${classSlug}/build/${code}/` : `/${classSlug}/`;
}

export function emptyRanks(talents: Talent[]): RankMap {
  const ranks: RankMap = {};
  for (const t of talents) ranks[t.id] = 0;
  return ranks;
}
