import metaJson from '../../data/meta.json';
import classesJson from '../../data/classes.json';
import talentsJson from '../../data/talents.json';
import faqJson from '../../data/faq.json';
import betaJson from '../../data/beta.json';
import classCopyJson from '../../data/class-copy.json';
import type { ClassCopy, ClassInfo, FaqItem, Meta, Talent } from './types';

export const meta = metaJson as Meta;
export const classes = classesJson as ClassInfo[];
export const talents = talentsJson as Talent[];
export const homeFaq = faqJson.home as FaqItem[];
export const betaEntries = betaJson.entries;
export const classCopyBySlug = classCopyJson as Record<string, ClassCopy>;

export function getClassCopy(slug: string): ClassCopy | undefined {
  return classCopyBySlug[slug];
}

export const CLASS_SLUGS = classes.map((c) => c.slug);

export function getClass(slug: string): ClassInfo | undefined {
  return classes.find((c) => c.slug === slug);
}

export function getTalentsForClass(classSlug: string): Talent[] {
  return talents.filter((t) => t.class === classSlug);
}

export function getTalent(classSlug: string, talentId: string): Talent | undefined {
  return talents.find((t) => t.class === classSlug && t.id === talentId);
}

export function getTalentsForTree(classSlug: string, treeSlug: string): Talent[] {
  return talents
    .filter((t) => t.class === classSlug && t.tree === treeSlug)
    .sort((a, b) => a.order - b.order);
}

export function formatCheckedAt(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatCheckedAtShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function changeLabel(change: Talent['change']): string {
  switch (change) {
    case 'new':
      return 'N';
    case 'changed':
      return 'C';
    case 'moved':
      return 'M';
    default:
      return '';
  }
}

export function changeTitle(change: Talent['change']): string {
  switch (change) {
    case 'new':
      return 'New since Classic';
    case 'changed':
      return 'Changed since Classic';
    case 'moved':
      return 'Moved since Classic';
    default:
      return 'Unchanged since Classic';
  }
}

/** Short screen-reader label — avoids repeating “since Classic” hundreds of times in HTML. */
export function changeSrLabel(change: Talent['change']): string {
  switch (change) {
    case 'new':
      return 'New';
    case 'changed':
      return 'Changed';
    case 'moved':
      return 'Moved';
    default:
      return 'Unchanged';
  }
}
