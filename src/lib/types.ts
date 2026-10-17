export type ChangeKind = 'new' | 'changed' | 'moved' | 'unchanged';

export type Talent = {
  id: string;
  numericId: number;
  name: string;
  class: string;
  tree: string;
  treeId: number;
  order: number;
  row: number;
  col: number;
  maxRank: number;
  pointsRequired: number;
  icon: string;
  spellId: number;
  requires?: string;
  requiresAny?: string[];
  change: ChangeKind;
  changeNote?: string;
  ranks: string[];
  pickedPct?: number;
};

export type ClassTree = {
  id: number;
  slug: string;
  name: string;
  rows: number;
  columns: number;
};

export type ClassInfo = {
  id: number;
  slug: string;
  name: string;
  trees: ClassTree[];
  talentCount: number;
  accent?: string;
  intro: string;
};

export type ClassFigure = {
  src: string;
  alt: string;
  caption?: string;
};

export type ClassCopy = {
  intro?: string;
  figures?: ClassFigure[];
  sections?: { heading: string; paragraphs: string[] }[];
  faqs?: FaqItem[];
};

export type Meta = {
  clientBuild: string;
  checkedAt: string;
  source: string;
  sourceUrl: string;
  attribution: string;
  classicDiffSource?: string | null;
  levelCap: number;
  totalPoints: number;
  rowGate: number;
  totalTalents: number;
  changeCounts?: {
    new: number;
    changed: number;
    moved: number;
    unchanged: number;
  };
  levelsThatGrantPoint: number[];
};

export type RankMap = Record<string, number>;

export type FaqItem = { q: string; a: string };
