# AGENTS.md — talcalc.com

> 本文件是本仓库的最高约束。任何 AI（Cursor / Claude Code / Copilot）在生成、修改、
> 重构本仓库任何文件之前，必须先读完本文件。本文件与任何临时指令冲突时，以本文件为准。
> 违反第 2 节「红线」的产出，一律回滚，不做讨论。

---

## 0. 开工前先回答这三个问题

每次接到任务，先在心里（或直接回复里）答这三句，再动手：

1. **这个改动会不会让页面在 HTML 源码里少内容？**（预渲染是本项目的命门）
2. **这个数字我从哪来的？**（必须来自 `data/*.json`，不允许编造或从竞品页面照抄）
3. **这个改动服务的是「11/4 前被收录」这个目标吗？**（不是的话，不做）

答不上来就先问，不要猜着写。

---

## 1. 项目是什么

- **站名**：Talc｜**域名**：`https://talcalc.com`
- **一句话**：World of Warcraft 新版本「Forever」的**九职业天赋计算器**，英语市场，免费、无需登录。
- **品类**：交互式工具站（不是内容站、不是攻略站、不是 SaaS）。
- **唯一目标**：让 Google 首轮抓取就读到完整内容 + 让玩家能算、能存、能分享。
- **硬期限**：**2026-11-04**（游戏全球上线）之前完成收录与信任评估。
  官方时间线：10/19 压力测试 → 10/21 beta 结束 → 10/27 角色名预约 → 11/4 全球上线。
- **成功判据**：上线后页面能被 Google 收录、在目标词下有展现；不是"功能很多"。

---

## 2. 红线（违反即回滚，无例外）

1. **域名、站名、品牌名里不得出现**：`wow` / `world of warcraft` / `warcraft` / 任何扩展包名。
   （暴雪 Trademark Usage Guidelines 的 Do Not 清单明列此项；Legal FAQ 亦以 `star-craft.com` 为例答「No」。）
2. **不得暗示与暴雪有关联**：不用官方 logo、不写 "official"、"partner"、"endorsed" 等字样。
3. **每一页的 footer 必须有免责声明**，写死在布局组件里，不允许逐页手写、不允许漏：

   ```html
   <p class="disclaimer">
     Talc is an unofficial fan-made tool for World of Warcraft®. Not affiliated with,
     endorsed by, or sponsored by Blizzard Entertainment, Inc. All game content, names
     and materials are trademarks and copyrights of their respective owners.
   </p>
   ```

4. **站内首次出现游戏名时用规范写法**：`World of Warcraft®` / `WoW: Forever™`。
5. **所有页面必须预渲染出完整 HTML**：天赋名、每 rank 描述、职业名都要在 `view-source` 里看得到。
   禁止「首屏骨架 + 客户端 fetch 数据」这种写法。
6. **分享 URL 用真路径**，禁止 `#` 锚点（搜索引擎不认）。
7. **不允许编造任何数字**：搜索量、玩家数、拾取率、天赋数量、版本号、日期——全部要么来自 `data/*.json`，
   要么不写。也从竞品页面照抄数字（它的口径不是官方口径）。
8. **不上任何未列入第 13 节的功能**。想加，先改本文件。

---

## 3. 技术栈与部署

| 项 | 决定 | 不允许 |
|---|---|---|
| 框架 | **Astro 5 + TypeScript** | 不引入 Next.js / Nuxt 等带 runtime 的框架 |
| 样式 | **Tailwind CSS** | 不引入 UI 组件库（首版） |
| 渲染 | `output: 'static'`；**仅** `/{class}/build/[code]` 用 `prerender = false` | 不允许其他页面 SSR |
| 部署 | **Cloudflare Pages**（Functions 承载那一个 SSR 路由） | **不使用 Vercel**（我方既有 Vercel CPU 用量问题） |
| 数据 | 构建期 JSON，无数据库、无后端、无账号、无外部 API | 不允许运行时抓第三方接口 |
| 分析 | Cloudflare Web Analytics | 不引入 GA（首版免同意横幅） |

`astro.config.mjs` 必须保持形如：

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://talcalc.com',
  output: 'static',
  integrations: [tailwind(), sitemap({
    filter: (page) => !page.includes('/build/'),   // 分享页单独一个 sitemap
  })],
});
```

**目标目录结构**（新增目录前先想清楚它属于哪一层）：

```
src/
  layouts/         BaseLayout.astro（tdk / schema / 内链 / 免责声明都在这里）
  components/      TalentTree / ClassPicker / BuildSummary / Faq / Breadcrumbs
  pages/
    index.astro
    [class]/
      index.astro                    职业页
      talents/[talent]/index.astro   天赋页
      build/[code].astro             分享页（SSR）
    beta/index.astro
    404.astro
  lib/             decodeBuild / encodeBuild / schema builders / seo helpers
data/
  meta.json        版本与常量
  talents.json     天赋主数据
  classes.json     九职业元数据
```

---

## 4. 数据层规范

**所有内容数据只能来自 `data/`，组件里不得硬编码任何游戏数据。**

```ts
// data/meta.json —— 每版客户端更新重建一次
{
  "clientBuild": "1.60.1.70425",
  "checkedAt": "2026-10-16",
  "source": "client DB2",
  "levelCap": 60,
  "totalPoints": 51,
  "rowGate": 5,
  "totalTalents": 466
}

// data/talents.json
export type Talent = {
  id: string;             // 稳定 slug：improved-heroic-strike（一旦上线不可改，会断链）
  name: string;
  class: string;          // warrior
  tree: 'arms' | 'fury' | 'protection';
  row: number;            // 1..11
  col: number;            // 0..3
  maxRank: number;        // 1..5
  icon: string;
  requires?: string;      // 前置天赋 slug
  change: 'new' | 'changed' | 'moved' | 'unchanged';   // 相对 Classic
  changeNote?: string;
  ranks: string[];        // 每 rank 的客户端原文描述
  pickedPct?: number;     // P1，先留字段不填
};
```

规则：

- **`clientBuild` 与 `checkedAt` 必须在页面上可见**（首页副标题、职业页、天赋页都要有）。
  这是这块唯一的护城河——竞品数据会过期，标了版本号才显得可信。
- **数据源切换（DB2 / 公开 DB 站 / 抓页面）不影响上层组件**，只改构建脚本。
- **`id` 是永久契约**：一旦上线，改 `id` 等于制造 404，必须走重定向并记录在 `src/lib/redirects.ts`。
- **版本更新后 24 小时内**重建数据并在 `/beta/` 记录改动。

---

## 5. 路由与页面职责

| 路由 | 数量 | 职责 | 渲染 |
|---|---|---|---|
| `/` | 1 | 计算器本体 + 九职业入口 | SSG |
| `/[class]/` | 9 | 单职业三系树 + 热门 build + 改动列表 | SSG |
| `/[class]/talents/[talent]` | ≈470 | 单天赋详情，长尾主力 | SSG（批量生成） |
| `/[class]/build/[code]` | N | 分享页 | **SSR** |
| `/beta/` | 1 | 客户端版本变更记录 | SSG |
| `/questions/` | 1 | 问答（P1） | SSG |
| `404` | 1 | 带九职业内链 | — |

- **一个页面打一个核心词**，不许一页贪多词。
- 九职业 slug 固定：`warrior` `paladin` `hunter` `rogue` `priest` `shaman` `mage` `warlock` `druid`。
- 新增页面类型前，先确认它属于上表哪一格；不属于就说明它超出了首版范围。

---

## 6. TDK 与结构化数据规范

**Title** ≤ 60 字符、**Description** ≈ 155 字符，每页唯一。模板：

```html
<!-- 首页 -->
<title>WoW Forever Talent Calculator – All 9 Classes, 51 Points</title>
<meta name="description" content="Free WoW Forever talent calculator for all nine classes and 51 points. Every talent and rank read from client build 1.60.1.70425, checked 16 October 2026. Plan a build, compare with Classic, share the link.">

<!-- 职业页 -->
<title>WoW Forever {Class} Talent Calculator – All 3 Trees</title>
<meta name="description" content="{Class} talent calculator for WoW Forever: full Arms, Fury and Protection trees, 51 points, every rank, plus the most planned builds. Data from client build 1.60.1.70425.">
```

**每页必备**：

- `<link rel="canonical" href="https://talcalc.com/{当前路径}/">`（自指；**分享页不 canonical 到首页**）
- `og:title` / `og:description` / `og:image`（1200×630）
- `<link rel="alternate" hreflang="en">`（首版只此一条）
- 可见面包屑 + `BreadcrumbList`

**结构化数据**（JSON-LD，写入 `<head>`）：

- 首页：`WebSite` + `WebPage`（带 `dateModified`）+ `ItemList`（九职业，position 1–9）+ `WebApplication`（`applicationCategory: "GameApplication"`，`offers: {price: 0}`）+ `FAQPage`
- 职业页 / 天赋页：`WebPage` + `BreadcrumbList`（+ 有 FAQ 时加 `FAQPage`）
- **`FAQPage` 的条目必须与页面可见 FAQ 一一对应**，数量、措辞都别错位（对不上就是作弊信号）

`FAQPage` 的答案只能来自 `data/` 或已核实的事实。**禁止**为了凑问答编内容。

---

## 7. 内链规范

**每个新页面三件套齐活才允许提交**：

1. **上行**：至少 1 条指向父层（天赋页 → 职业页 → 首页）
2. **同层**：至少 1 条指向同层兄弟（同职业其他天赋 / 其他职业）
3. **下行**：父层页面必须有一条指向该新页

其他规则：

- 内链必须是**可点文本链接（`<a href>`）**，不许 JS `onclick` 跳转、不许 `#` 占位。
- 首页 ↔ 九职业页 ↔ 天赋页三向连通，没有孤岛页面。
- 404 页必须带九职业内链（别浪费任何一个进来的流量）。
- 分享页必须带九职业内链 + 「在计算器里打开」按钮。

---

## 8. 文字与内容风格

- **语言**：英语。玩家口吻，直接、简洁。
- **不做营销腔**：禁止 "the best"、"ultimate"、"revolutionary" 这类无法验证的词。
- **数据必须标来源与版本**：写「read from client build 1.60.1.70425, checked 16 Oct 2026」，
  不写「最新数据」「官方数据」。
- **不写没核实的推测**：拿不准的句子直接删掉，宁缺勿错。
- **玩家术语用原词**：talent / build / spec / BiS / tier，不要翻译或改写。
- **篇幅**：职业页正文 ≥ 300 词有效内容；天赋页每页必须有实质信息（不能只有一句描述 + 一堆导航）。
  避免「模板自带内容占多数」——这是被判重复的唯一红线。

---

## 9. 国际化

**首版不做多语言**。只保留 `hreflang="en"` 一条。
任何要求「顺手加个 i18n」的需求，一律推迟到 11/4 之后，并先改本文件。

---

## 10. 性能与可访问性

- Lighthouse 移动端 **≥ 90**（性能 / 可访问性 / 最佳实践 / SEO 四项都别有红）。
- 天赋图标用 WebP、显式宽高、首屏 lazy 关闭。
- 计算器**键盘可达**：Tab 能依次到达天赋格，Enter/Space 能加点。
- 对比度满足 WCAG AA；N / C / M 标记不能只靠颜色区分（要有文字或图案）。
- 首屏 JS 预算 **≤ 120KB gzip**（天赋树组件用 islands 局部水合，别整页 hydrate）。

---

## 11. 提交前自检清单（每页都要过）

- [ ] `npm run build` 无报错
- [ ] `curl -s https://talcalc.com/{该页}/ | grep "{一个应该出现在页面上的天赋名}"` **有命中**
- [ ] Title / Description / canonical / OG 齐，且唯一
- [ ] 面包屑 + JSON-LD 通过富媒体测试，零报错
- [ ] 内链三件套齐（上行 / 同层 / 下行）
- [ ] footer 免责声明在
- [ ] 移动端能完成一次完整配点
- [ ] 页面里没有硬编码的游戏数据（都在 `data/`）
- [ ] 没有出现第 2 节红线词汇

---

## 12. 排期与里程碑

| 天 | 交付物 | 完成判据 |
|---|---|---|
| D1 | 骨架 + **数据源确认** + 打通 warrior | 三系树 JSON 能正确渲染 |
| D2–3 | 计算器核心（见 §5 验收表） | 51 点 / 5 点行门槛 / maxRank / 前置依赖 / URL 同步 / localStorage / 对比 Classic 全过 |
| D4 | 九职业页 + 天赋页模板（先出 warrior 52 个） | 全部 200，`view-source` 能看到全部天赋名 |
| D5 | 首页 + FAQ + 四件套 Schema + sitemap + robots | 富媒体测试通过 |
| D6 | 分享页 SSR + 动态 OG 图 + 移动端 + 404 | 移动端 ≥ 90，分享链接能出卡片 |
| D7 | 上线 + GSC 提交 + 请求索引 | 留 10 天给 11/4 前被收录 |

**计算器验收表（12 项，缺一不可）**：

| # | 规格 | 验收标准 |
|---|---|---|
| 1 | 9 职业 × 3 系切换 | 不刷新页面 |
| 2 | 总点数 51，实时显示已用 / 剩余 | 超分配要拦住 |
| 3 | 每系投满 5 点才解锁下一行 | 未达标行置灰 + tooltip |
| 4 | maxRank 限制（1–5） | 点满不能再加 |
| 5 | 前置天赋依赖 | 不满足则不可点 |
| 6 | URL 实时同步 | 每加一点地址栏变一次 |
| 7 | 复制分享链接 | 无痕能完整还原 |
| 8 | localStorage 存草稿 | 关页面再开还在 |
| 9 | 一键对比 Classic | 并排显示差异标记 |
| 10 | N / C / M 标记 | 新增 / 改动 / 移位，hover 有说明 |
| 11 | 重置 / 撤销 | — |
| 12 | 移动端可用 | 手机能完成一次完整配点 |

---

## 13. 首版明确不做

❌ 账号系统
❌ build 社区投票榜（前端静态占位可以）
❌ 多语言
❌ abilities / racials / professions 等 hub 页
❌ 评论
❌ 广告位（`/builds/` 只留静态占位）
❌ 原生 App
❌ 数据实时 API
❌ 用户提交 build

**理由**：同赛道头部站的量 76–85% 来自直访 + 社媒，SEO 只是其中一块。首版只做「算得对、读得到、分享得出去」。

---

## 14. 不确定时的处理顺序

1. **先查本文件**。文件里有的，照做。
2. **文件里没写的**，看它是否影响 §2 红线或 §5 路由。影响 → 停下来问用户。
3. **既不触红线也不加路由的实现细节**（组件怎么拆、函数怎么命名）→ 自己决定，别问。
4. **任何涉及数字、日期、版本号的内容** → 必须来自 `data/`；没有就停下来问，不许编。
5. **任何"顺手优化"** → 不做。11/4 之前，只做排期里的事。

---

## 15. 参数区（换站只改这一段）

> 本文件前 14 节是**通用模板**，可整套复用到下一个工具站。换站时只改下面这张表，
> 以及 §1 / §6 / §12 里出现具体值的地方。

| 参数 | 本项目值 |
|---|---|
| 域名 | `talcalc.com` |
| 站名 | Talc |
| 游戏 | World of Warcraft: Forever |
| 工具类型 | 天赋计算器 |
| 主维度 | 职业（9 个） |
| 子维度 | 天赋（466，以 data/meta.json 为准） |
| 版本标识 | `clientBuild` = 1.60.1.70425（以 data/meta.json 为准） |
| 核对日期 | 2026-10-16（以 data/meta.json 为准） |
| 关键常量 | 等级上限 60、总点数 51、行门槛 5、天赋总数 466 |
| 硬期限 | 2026-11-04 |
| 渲染策略 | 静态为主 + 分享页 SSR |
| 部署 | Cloudflare Pages |

**通用性检查**：换成「某游戏的装备计算器」，只需改这张表 + `data/` 的 schema 字段名，
第 2 / 5 / 6 / 7 / 11 节的规则一字不用改。如果改起来发现某条规则绑死了 WoW，
说明那条规则写错了地方，应该抽象后挪回通用部分。
