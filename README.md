# Talc (talcalc.com)

Unofficial World of Warcraft®: Forever™ talent calculator — nine classes, 51 points, static HTML for Google, share links via Cloudflare Pages.

## Quick start

```bash
npm install
npm run data:build   # raw → data/meta|classes|talents.json
npm run dev
npm run build        # data + astro build + HTML checks
```

## Data source

Talent trees come from the public tool-maker export:

- https://wow-forever.gg/developers/talents.json  
- Licence: CC BY 4.0 (compilation). Attribution line is rendered in the footer.  
- Client build / check date are taken from that file — never invented.

Refresh:

```bash
curl -o data/raw-talents.json https://wow-forever.gg/developers/talents.json
npm run data:build
```

## Deploy (Cloudflare Pages)

Live site: **https://talcalc.com** (apex is canonical)
Pages project: **talc** → https://talc-7io.pages.dev/
Repo: https://github.com/jiangxianglin/talcalc

Pushes to `master` deploy automatically (Pages Git integration,
build command `npm run build`, output dir `dist`).

Manual deploy still works as a fallback:

```bash
npm run deploy
# or: npm run build && npx wrangler pages deploy dist --project-name=talc --branch=master --commit-dirty=true
```

Zone setup for `talcalc.com` (already done, listed so it is not re-litigated):

- NS at Spaceship → `eva.ns.cloudflare.com`, `robert.ns.cloudflare.com`
- `CNAME @ → talc-7io.pages.dev` and `CNAME www → talc-7io.pages.dev`, both proxied
- Redirect Rule (single redirect): `https://www.*` → `https://${1}`, 301, preserve query string
- SSL/TLS mode Full, Always Use HTTPS on, Automatic HTTPS Rewrites on

After deploy:

1. Cloudflare Dashboard → Pages → **talc** → **Custom domains** → add `talcalc.com` + `www` (DNS on Cloudflare).
2. Enable **Web Analytics**, set Pages env `PUBLIC_CF_BEACON`, redeploy.
3. Google Search Console: verify domain, submit `https://talcalc.com/sitemap-index.xml`, request indexing for `/` and the 9 class URLs.
4. In ChatGPT: ask what talcalc.com is / whether you’d recommend it (after the custom domain resolves).

Only `/{class}/build/[code]/` is SSR (`public/_routes.json`). Everything else is static HTML.

## OG cards

`public/og/*.png` are 1200×630 cards rendered from `scripts/og/og_card.html` and committed
(the build no longer regenerates them). To re-render one:

```bash
chrome --headless --disable-gpu --hide-scrollbars --window-size=1200,630 \
  --screenshot=public/og/warrior.png \
  "file:///<abs>/scripts/og/og_card.html?name=Warrior&accent=%23c05032"
```

Accent per class is the class colour used on the site (`#c05032` warrior, `#c8a03c` paladin,
`#5a963c` hunter, `#b4aa3c` rogue, `#c8c8d2` priest, `#3c78c8` shaman, `#508cd2` mage,
`#8c46b4` warlock, `#b46e28` druid); the home card uses gold `#c9a96e`.

## MVP status

| Area | Status |
|---|---|
| 9 class pages + 466 talent pages | Done (SSG, names/ranks in HTML) |
| Class SEO copy (`data/class-copy.json`) | Generated for all 9 via `npm run data:build` |
| Home + class FAQ | Expanded; FAQPage matches visible FAQs |
| Calculator: 51 pts, row gate, maxRank, prereqs, arrows, undo/reset, localStorage | Done |
| Icons + hover tooltips | Done (Blizzard icon CDN) |
| URL share encode/decode (LZ) | Done on class / build pages |
| Classic N/C/M diffs | Done via `data/raw-talent-changes.csv` |
| AI crawlers | `robots.txt` allows GPTBot etc.; `public/llms.txt` |
| Cloudflare Web Analytics | Set `PUBLIC_CF_BEACON` (see `.env.example`) |
| OG art | Designed 1200×630 cards in `public/og/` (template: `scripts/og/og_card.html`) |
| GSC | Configure after DNS → Pages |

## Local preview

```bash
npm run dev
# http://localhost:4321/
```
