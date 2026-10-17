import type { ClassInfo, FaqItem, Meta } from './types';

const SITE = 'https://talcalc.com';

export function faqEntities(faqs: FaqItem[]) {
  return faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.a,
    },
  }));
}

export function homeGraph(meta: Meta, classes: ClassInfo[], faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        url: `${SITE}/`,
        name: 'Talc',
        inLanguage: 'en',
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE}/#webpage`,
        url: `${SITE}/`,
        name: 'WoW Forever Talent Calculator',
        dateModified: meta.checkedAt,
        isPartOf: { '@id': `${SITE}/#website` },
      },
      {
        '@type': 'ItemList',
        name: 'Talent calculators by class',
        itemListElement: classes.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE}/${c.slug}/`,
          name: c.name,
        })),
      },
      {
        '@type': 'WebApplication',
        name: 'WoW Forever Talent Calculator',
        applicationCategory: 'GameApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqEntities(faqs),
      },
    ],
  };
}

export function breadcrumbList(
  items: { name: string; url: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function classPageGraph(
  meta: Meta,
  cls: ClassInfo,
  faqs: FaqItem[],
) {
  const url = `${SITE}/${cls.slug}/`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: `WoW Forever ${cls.name} Talent Calculator`,
        dateModified: meta.checkedAt,
      },
      breadcrumbList([
        { name: 'Home', url: `${SITE}/` },
        { name: cls.name, url },
      ]),
      ...(faqs.length
        ? [{ '@type': 'FAQPage', mainEntity: faqEntities(faqs) }]
        : []),
    ],
  };
}

export function talentPageGraph(
  cls: ClassInfo,
  talentName: string,
  talentUrl: string,
) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${talentUrl}#webpage`,
        url: talentUrl,
        name: talentName,
      },
      breadcrumbList([
        { name: 'Home', url: `${SITE}/` },
        { name: cls.name, url: `${SITE}/${cls.slug}/` },
        { name: talentName, url: talentUrl },
      ]),
    ],
  };
}
