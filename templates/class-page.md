# 职业页成品模板 — `/[class]/`

> 可直接粘贴进 `src/pages/[class]/index.astro`。  
> `{…}` = 构建期从 `data/` 注入；**禁止**在模板里写死未核过的数字。  
> 口径对齐 `AGENTS.md` §5 / §6 / §7 / §8。

---

## 0. 数据契约（渲染前必须齐）

来自 `data/classes.json` 的单职业对象（字段名可微调，语义不变）：

```ts
type ClassPage = {
  slug: string;           // warrior
  name: string;           // Warrior
  trees: [string, string, string];  // ["Arms","Fury","Protection"]
  talentCount: number;    // 本职业天赋数，来自 talents.json 计数，勿手填
  intro: string;          // 1–2 句玩家口吻简介（英语，可手写但禁编数字）
  faqs: { q: string; a: string }[];  // 与页面可见 FAQ 一一对应
};
```

来自 `data/meta.json`（全站共用）：

- `clientBuild` → `{clientBuild}`
- `checkedAt` → `{checkedAt}`（页面显示用 `16 October 2026` 这种可读式）
- `totalPoints` → `{totalPoints}`（51）
- `rowGate` → `{rowGate}`（5）
- `levelCap` → `{levelCap}`（60）

来自 `data/talents.json`（本职业过滤）：

- 三系天赋列表 → 树组件 + 下方「天赋名清单」（保证 view-source 有全文）
- `change !== 'unchanged'` → N / C / M 列表
- 每个天赋的 `name` / `ranks[]` / `row` / `maxRank` / `requires`

九职业 slug 固定（同层内链用）：  
`warrior` `paladin` `hunter` `rogue` `priest` `shaman` `mage` `warlock` `druid`

---

## 1. TDK + head（每页唯一）

```html
<title>WoW Forever {Class} Talent Calculator – All 3 Trees</title>
<meta name="description" content="{Class} talent calculator for WoW Forever: full {Tree1}, {Tree2} and {Tree3} trees, {totalPoints} points, every rank, plus the most planned builds. Data from client build {clientBuild}.">
<link rel="canonical" href="https://talcalc.com/{class}/">
<link rel="alternate" hreflang="en" href="https://talcalc.com/{class}/">
<meta property="og:type" content="website">
<meta property="og:url" content="https://talcalc.com/{class}/">
<meta property="og:title" content="WoW Forever {Class} Talent Calculator – All 3 Trees">
<meta property="og:description" content="{Class} talent calculator for WoW Forever: full {Tree1}, {Tree2} and {Tree3} trees, {totalPoints} points. Read from client build {clientBuild}, checked {checkedAtReadable}.">
<meta property="og:image" content="https://talcalc.com/og/{class}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="WoW Forever {Class} Talent Calculator – All 3 Trees">
<meta name="twitter:description" content="{Class} talent calculator for WoW Forever: {totalPoints} points, all three trees. Client build {clientBuild}.">
<meta name="twitter:image" content="https://talcalc.com/og/{class}.png">
```

**字符预算自检（生成后数一遍）：**

| 字段 | 上限 | 说明 |
|---|---|---|
| Title | ≤ 60 | `{Class}` 最长 `Warlock` 时仍应 ≤ 60 |
| Description | ≈ 155 | 树名较长时优先砍 “plus the most planned builds” |

**Warrior 填好示例（可对照字符数）：**

```html
<title>WoW Forever Warrior Talent Calculator – All 3 Trees</title>
<meta name="description" content="Warrior talent calculator for WoW Forever: full Arms, Fury and Protection trees, 51 points, every rank, plus the most planned builds. Data from client build 1.60.1.70425.">
<link rel="canonical" href="https://talcalc.com/warrior/">
```

---

## 2. 页面模块顺序（勿改）

与竞品实测顺序对齐；缺块 = 内链或 SEO 不齐。

1. 可见面包屑  
2. H1 + 职业图标 + 一句话（含 build / checked）  
3. 三系完整天赋树（与首页同一组件，**SSG 出齐全天赋名与 rank 文**）  
4. 热门 build（首版静态占位，**不写未核拾取率数字**）  
5. 新增 / 改动 / 移位列表（N / C / M）  
6. 正文说明（≥ 300 词有效内容，见 §3）  
7. 本职业天赋名清单（给爬虫的纯 HTML 列表，可折叠 UI，**不可从 DOM 删掉**）  
8. FAQ（可见 + Schema 同文）  
9. 其他八职业内链 + 回首页  
10. footer 免责声明（布局层，本页不手写）

---

## 3. 可见 HTML 文案模板

把下面整段当 Astro 模板；花括号变量从 `data/` 注入。  
**斜体提示**只给作者看，上线前删掉。

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Talc</a></li>
    <li aria-current="page">{Class} talents</li>
  </ol>
</nav>

<header>
  <h1>WoW Forever {Class} Talent Calculator</h1>
  <p>
    Plan a full {Class} build across {Tree1}, {Tree2} and {Tree3}.
    Every talent and rank below is read from client build {clientBuild},
    checked {checkedAtReadable}. {totalPoints} points to {levelCap}.
  </p>
</header>

<!-- § 计算器：TalentTree island；其 SSR/SSG 槽位里必须已有全部天赋名与 ranks -->
<section aria-label="{Class} talent trees">
  <!-- <TalentTree class={slug} /> -->
</section>

<section>
  <h2>Popular {Class} builds</h2>
  <p>
    Sample layouts for theorycrafting. Counts and pick rates stay empty until
    we have our own data — we do not copy numbers from other sites.
  </p>
  <ul>
    <!-- 首版静态占位：链到 /{class}/build/{code} 真路径，禁止 # -->
    <li><a href="/{class}/build/{codeA}">{Tree1}-lean sample</a></li>
    <li><a href="/{class}/build/{codeB}">{Tree2}-lean sample</a></li>
    <li><a href="/{class}/build/{codeC}">{Tree3}-lean sample</a></li>
  </ul>
</section>

<section>
  <h2>What changed vs Classic</h2>
  <p>
    Marks on the tree: <strong>N</strong> new, <strong>C</strong> changed,
    <strong>M</strong> moved. List below is generated from this site’s dataset
    for build {clientBuild}.
  </p>
  <h3>New</h3>
  <ul><!-- each talent where change==='new' -->
    <li><a href="/{class}/talents/{talentId}/">{TalentName}</a> — {changeNote?}</li>
  </ul>
  <h3>Changed</h3>
  <ul><!-- change==='changed' --></ul>
  <h3>Moved</h3>
  <ul><!-- change==='moved' --></ul>
</section>

<article>
  <h2>How {Class} talents work in WoW Forever</h2>

  <!-- 下面整段计入「≥300 词」。树名/点数/门槛必须来自 data；勿加拾取率、热度、竞品数字。 -->

  <p>
    This page is the {Class} talent calculator for WoW: Forever™.
    You spend a shared pool of {totalPoints} talent points up to level {levelCap}.
    Points can go into any of the three trees — {Tree1}, {Tree2}, and {Tree3} —
    but each tree gates rows the Classic way: you need {rowGate} points in that
    tree before the next row unlocks.
  </p>

  <p>
    Use the tree above to click ranks, watch remaining points update, and copy
    the URL when you want to share. The address uses a real path
    (<code>/{class}/build/…</code>), so a fresh browser can reopen the same build.
    Drafts also stay in local storage on this device until you clear them.
  </p>

  <p>
    {intro}
  </p>

  <p>
    Compared with Classic, Forever retunes many {Class} talents. On this site,
    new talents show <strong>N</strong>, changed ranks show <strong>C</strong>,
    and talents that moved in the grid show <strong>M</strong>. Hover a mark
    for the short note from our dataset. We only list a change when it exists
    in <code>data/talents.json</code> for client build {clientBuild}.
  </p>

  <p>
    Looking for a single talent? Open any name in the index below for full rank
    text, requirements, and siblings in the same row. Prefer another class?
    Jump from the class list at the bottom — every class page links back here
    the same way.
  </p>

  <p>
    Data on this page: client build {clientBuild}, checked {checkedAtReadable}.
    When the client patches, we rebuild the JSON and note the delta on
    <a href="/beta/">/beta/</a> within 24 hours.
  </p>
</article>

<section>
  <h2>All {Class} talents</h2>
  <p>{talentCount} talents in this dataset for {Class}.</p>

  <h3>{Tree1}</h3>
  <ul>
    <!-- 每个天赋一 <li>，含 name；可选短 rank1 摘要。必须出现在 HTML 源码 -->
    <li>
      <a href="/{class}/talents/{id}/">{name}</a>
      — Row {row}, max rank {maxRank}. {ranks[0]}
    </li>
  </ul>

  <h3>{Tree2}</h3>
  <ul><!-- 同上 --></ul>

  <h3>{Tree3}</h3>
  <ul><!-- 同上 --></ul>
</section>

<section>
  <h2>{Class} talent calculator FAQ</h2>
  <dl>
    <!-- 与 schema FAQPage.mainEntity 逐条同文，勿错位 -->
    <div>
      <dt>How many talent points does {Class} get in WoW Forever?</dt>
      <dd>
        {Class} uses the shared pool of {totalPoints} points to level {levelCap},
        the same cap as every other class. Spend them across {Tree1}, {Tree2},
        and {Tree3}.
      </dd>
    </div>
    <div>
      <dt>How do row gates work on the {Class} trees?</dt>
      <dd>
        In each tree you must invest {rowGate} points before the next row unlocks.
        Rows that are still locked stay disabled until that tree reaches the gate.
      </dd>
    </div>
    <div>
      <dt>Where does this {Class} data come from?</dt>
      <dd>
        Every talent name and rank text on this page is read from client build
        {clientBuild}, checked {checkedAtReadable}. We do not invent ranks or
        copy pick-rate numbers from other fan sites.
      </dd>
    </div>
    <div>
      <dt>Can I share my {Class} build?</dt>
      <dd>
        Yes. Each point updates the URL under
        <code>https://talcalc.com/{class}/build/…</code>.
        Copy the link; anyone can open it without an account.
      </dd>
    </div>
    <div>
      <dt>Is the Talc {Class} calculator free?</dt>
      <dd>
        Yes. Talc is free and needs no login. It is an unofficial fan-made tool
        for World of Warcraft®.
      </dd>
    </div>
  </dl>
</section>

<nav aria-label="Other class calculators">
  <h2>All class talent calculators</h2>
  <ul>
    <li><a href="/warrior/">Warrior talent calculator</a></li>
    <li><a href="/paladin/">Paladin talent calculator</a></li>
    <li><a href="/hunter/">Hunter talent calculator</a></li>
    <li><a href="/rogue/">Rogue talent calculator</a></li>
    <li><a href="/priest/">Priest talent calculator</a></li>
    <li><a href="/shaman/">Shaman talent calculator</a></li>
    <li><a href="/mage/">Mage talent calculator</a></li>
    <li><a href="/warlock/">Warlock talent calculator</a></li>
    <li><a href="/druid/">Druid talent calculator</a></li>
  </ul>
  <p><a href="/">← Back to the full WoW Forever talent calculator</a></p>
</nav>
```

### 九职业树名（写入 `classes.json`，勿在组件里写死）

| slug | name | Tree1 | Tree2 | Tree3 |
|---|---|---|---|---|
| warrior | Warrior | Arms | Fury | Protection |
| paladin | Paladin | Holy | Protection | Retribution |
| hunter | Hunter | Beast Mastery | Marksmanship | Survival |
| rogue | Rogue | Assassination | Combat | Subtlety |
| priest | Priest | Discipline | Holy | Shadow |
| shaman | Shaman | Elemental | Enhancement | Restoration |
| mage | Mage | Arcane | Fire | Frost |
| warlock | Warlock | Affliction | Demonology | Destruction |
| druid | Druid | Balance | Feral | Restoration |

### `intro` 手写示例（Warrior；其他职业同结构，**仍禁编数字**）

```text
Arms leans into weapon skills and control, Fury stacks rage and attacks,
and Protection holds the line in group content. Mix trees if a hybrid path
fits your dungeon or open-world plan — the calculator will block illegal ranks
and unmet requirements as you click.
```

---

## 4. Schema JSON-LD（整段进 `<head>`）

规则：`FAQPage.mainEntity` 与上面可见 FAQ **条数、问句、答句完全一致**。  
`dateModified` 用 `meta.checkedAt`（ISO `YYYY-MM-DD`）。

### 4.1 通用模板

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://talcalc.com/{class}/#webpage",
      "url": "https://talcalc.com/{class}/",
      "name": "WoW Forever {Class} Talent Calculator – All 3 Trees",
      "description": "{Class} talent calculator for WoW Forever: full {Tree1}, {Tree2} and {Tree3} trees, {totalPoints} points, every rank. Data from client build {clientBuild}.",
      "dateModified": "{checkedAt}",
      "inLanguage": "en",
      "isPartOf": { "@id": "https://talcalc.com/#website" },
      "breadcrumb": { "@id": "https://talcalc.com/{class}/#breadcrumb" }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://talcalc.com/{class}/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Talc",
          "item": "https://talcalc.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "{Class} talents",
          "item": "https://talcalc.com/{class}/"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://talcalc.com/{class}/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How many talent points does {Class} get in WoW Forever?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "{Class} uses the shared pool of {totalPoints} points to level {levelCap}, the same cap as every other class. Spend them across {Tree1}, {Tree2}, and {Tree3}."
          }
        },
        {
          "@type": "Question",
          "name": "How do row gates work on the {Class} trees?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "In each tree you must invest {rowGate} points before the next row unlocks. Rows that are still locked stay disabled until that tree reaches the gate."
          }
        },
        {
          "@type": "Question",
          "name": "Where does this {Class} data come from?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Every talent name and rank text on this page is read from client build {clientBuild}, checked {checkedAtReadable}. We do not invent ranks or copy pick-rate numbers from other fan sites."
          }
        },
        {
          "@type": "Question",
          "name": "Can I share my {Class} build?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Each point updates the URL under https://talcalc.com/{class}/build/…. Copy the link; anyone can open it without an account."
          }
        },
        {
          "@type": "Question",
          "name": "Is the Talc {Class} calculator free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Talc is free and needs no login. It is an unofficial fan-made tool for World of Warcraft®."
          }
        }
      ]
    }
  ]
}
```

### 4.2 Warrior 填好成品（可直接测富媒体）

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://talcalc.com/warrior/#webpage",
      "url": "https://talcalc.com/warrior/",
      "name": "WoW Forever Warrior Talent Calculator – All 3 Trees",
      "description": "Warrior talent calculator for WoW Forever: full Arms, Fury and Protection trees, 51 points, every rank. Data from client build 1.60.1.70425.",
      "dateModified": "2026-10-16",
      "inLanguage": "en",
      "isPartOf": { "@id": "https://talcalc.com/#website" },
      "breadcrumb": { "@id": "https://talcalc.com/warrior/#breadcrumb" }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://talcalc.com/warrior/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Talc",
          "item": "https://talcalc.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Warrior talents",
          "item": "https://talcalc.com/warrior/"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://talcalc.com/warrior/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How many talent points does Warrior get in WoW Forever?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Warrior uses the shared pool of 51 points to level 60, the same cap as every other class. Spend them across Arms, Fury, and Protection."
          }
        },
        {
          "@type": "Question",
          "name": "How do row gates work on the Warrior trees?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "In each tree you must invest 5 points before the next row unlocks. Rows that are still locked stay disabled until that tree reaches the gate."
          }
        },
        {
          "@type": "Question",
          "name": "Where does this Warrior data come from?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Every talent name and rank text on this page is read from client build 1.60.1.70425, checked 16 October 2026. We do not invent ranks or copy pick-rate numbers from other fan sites."
          }
        },
        {
          "@type": "Question",
          "name": "Can I share my Warrior build?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Each point updates the URL under https://talcalc.com/warrior/build/…. Copy the link; anyone can open it without an account."
          }
        },
        {
          "@type": "Question",
          "name": "Is the Talc Warrior calculator free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Talc is free and needs no login. It is an unofficial fan-made tool for World of Warcraft®."
          }
        }
      ]
    }
  ]
}
</script>
```

### 4.3 Astro 组装示意（`src/lib/schema/classPage.ts`）

```ts
import meta from '../../../data/meta.json';

export function classPageGraph(cls: {
  slug: string;
  name: string;
  trees: [string, string, string];
  faqs: { q: string; a: string }[];
}) {
  const [t1, t2, t3] = cls.trees;
  const checkedAtReadable = new Date(meta.checkedAt + 'T00:00:00Z').toLocaleDateString(
    'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' },
  );

  // faqs 必须与页面 <dl> 同文；推荐页面与 schema 共用同一数组，禁止两处各写一份
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `https://talcalc.com/${cls.slug}/#webpage`,
        url: `https://talcalc.com/${cls.slug}/`,
        name: `WoW Forever ${cls.name} Talent Calculator – All 3 Trees`,
        description: `${cls.name} talent calculator for WoW Forever: full ${t1}, ${t2} and ${t3} trees, ${meta.totalPoints} points, every rank. Data from client build ${meta.clientBuild}.`,
        dateModified: meta.checkedAt,
        inLanguage: 'en',
        isPartOf: { '@id': 'https://talcalc.com/#website' },
        breadcrumb: { '@id': `https://talcalc.com/${cls.slug}/#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `https://talcalc.com/${cls.slug}/#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Talc', item: 'https://talcalc.com/' },
          {
            '@type': 'ListItem',
            position: 2,
            name: `${cls.name} talents`,
            item: `https://talcalc.com/${cls.slug}/`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `https://talcalc.com/${cls.slug}/#faq`,
        mainEntity: cls.faqs.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  };
}
```

---

## 5. 内链三件套（提交前勾）

| 方向 | 本页必须有 |
|---|---|
| 上行 | 面包屑 / 文内 → `/` |
| 同层 | 「All class talent calculators」里其他 8 个职业 |
| 下行 | 每个天赋名 → `/{class}/talents/{id}/`；热门 build → `/{class}/build/{code}` |

父层义务：首页九宫格必须有一条指向本 `/{class}/`（在首页做，不在本页补）。

---

## 6. 提交前自检（职业页专用）

- [ ] `view-source` 能搜到本职业至少一个真实天赋名 + 一段 rank 原文  
- [ ] Title / Description / canonical / OG 齐，且九页互不重复  
- [ ] 正文有效内容 ≥ 300 词（天赋清单与 FAQ 可另计，但正文本身别空）  
- [ ] 可见 FAQ 与 `FAQPage` 同文同序  
- [ ] 无竞品拾取率 / builds planned 等未核数字  
- [ ] 树名来自 `classes.json`，点数 / build / 日期来自 `meta.json`  
- [ ] footer 免责声明在（布局层）  
- [ ] 富媒体测试：BreadcrumbList + FAQPage 零报错  

---

## 7. 参数区（换站时对照 `AGENTS.md` §15）

| 槽位 | 本项目 |
|---|---|
| 主维度页 | `/{class}/` |
| 主维度名 | Class / 职业 |
| 子维度页 | `/{class}/talents/{talent}/` |
| 分享页 | `/{class}/build/{code}` |
| 版本字段 | `clientBuild` + `checkedAt` |
| 玩法常量 | `totalPoints` / `rowGate` / `levelCap` |
