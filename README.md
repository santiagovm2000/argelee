# Argelee

Landing page and made-to-order menu for **ArGeles**, artisan jellies. Visitors pick a piece, its
flavours, its fruit and its size, and the order opens in WhatsApp already written out. The menu is
edited by the owner in a private panel and lives in Cloudflare KV; the site is prerendered and
served as static files with a light Worker in front. Spanish only, no component library.

**Angular 22** · **Tailwind CSS 4** · **Transloco** · **Bun** · **Cloudflare Workers, KV, R2**

## Requirements

- [Bun](https://bun.sh) 1.3+
- A `wrangler login` (once per machine) to pull the catalogue and to deploy

## Setup

```bash
bun install
cp .env.example .env         # optional locally; CI sets the same variables
bun run catalog:seed --local # fills the local KV and R2 from assets-src/catalog/seed
bun start                    # site http://localhost:4200, panel http://localhost:4300
```

`bun start` runs the site Worker (8787), the admin Worker (8790) and both Angular dev servers.
The panel needs `admin/.dev.vars`; `bun run admin:credentials --local` writes it.

## Commands

| Command                     | What it does                                                                     |
| --------------------------- | -------------------------------------------------------------------------------- |
| `bun start`                 | The whole local stack: two Workers, site and panel dev servers                   |
| `bun run build`             | Pulls the catalogue, prerenders the site, builds the panel, writes crawler files |
| `bun run verify`            | i18n + contrast + templates + structure + lint + test + build. The gate.         |
| `bun run test`              | Vitest, from `tests/`                                                            |
| `bun run lint` / `lint:fix` | ESLint (type-aware)                                                              |
| `bun run format`            | Prettier, with Tailwind class sorting                                            |
| `bun run i18n`              | Regenerates typed translation keys for the site and the panel                    |
| `bun run catalog:pull`      | Writes the catalogue snapshot the build prerenders from (KV, or local state)     |
| `bun run catalog:seed`      | Uploads the seed document, photos and PDF (`--local` or `--remote`)              |
| `bun run admin:credentials` | Sets the panel's user and password hash (`--local` or `--remote`)                |
| `bun run catalog-pdf`       | Prints the price-list PDF locally from the catalogue snapshot, with Edge         |
| `bun run images`            | Builds responsive AVIF derivatives and social cards from `assets-src/`           |
| `bun run favicon`           | Outlines the wordmark's "A" into `favicon.svg`, `favicon.ico` and the touch icon |
| `bun run social-card`       | Draws the brand card behind the home page link preview, then runs `images`       |
| `bun run palette`           | Re-derives the colour scale from the brand hex                                   |
| `bun run contrast`          | WCAG AA check across every token pairing, both themes                            |

## Deploying

Production is two **Cloudflare Workers**: `argelees` serves <https://argelees.com> (the prerendered
files as static assets plus a small script for the live catalogue, photos, sitemap and PDF) and
`argelees-admin` serves the panel at <https://admin.argelees.com>. Both are declared in their
`wrangler.jsonc`; `public/_headers` is generated from the same security headers the Workers send.
Zone-level settings (HTTPS enforcement, HSTS, DNSSEC, the `www` → apex redirect, image
transformations) live in the Cloudflare dashboard, not in the repo.

```bash
bun run wrangler login                          # once per machine, opens the browser
SITE_IMAGE_TRANSFORMS=true bun run deploy       # build + upload both Workers
```

`SITE_IMAGE_TRANSFORMS` stays out of `.env` on purpose: on, the site builds its image URLs through
Cloudflare's transformations, which only exist in production. CI sets it; a deploy from a laptop
passes it inline.

Every push to `main` also deploys through `.github/workflows/deploy.yml`, which needs two
repository secrets: `CLOUDFLARE_API_TOKEN` (an "Edit Cloudflare Workers" token that can read the
`CATALOG` KV namespace) and `CLOUDFLARE_ACCOUNT_ID`. The panel's own secrets are set once with
`wrangler secret put`; see `docs/ADMIN.md`.

Build environment (`.env` locally, the workflow in CI):

| Variable                | Purpose                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| `SITE_ORIGIN`           | absolute origin for canonical, og:image and sitemap URLs               |
| `SITE_INDEXABLE`        | `false` on previews — emits `noindex` and `Disallow: /`                |
| `SITE_IMAGE_TRANSFORMS` | `true` where Cloudflare image transformations are enabled (production) |
| `CATALOG_SOURCE`        | `local` to pull the catalogue from the `wrangler dev` state            |

## Documentation

| File                    | Contents                                                   |
| ----------------------- | ---------------------------------------------------------- |
| `CLAUDE.md`             | Project rules, loaded by Claude Code every session         |
| `docs/ARCHITECTURE.md`  | Layers, folder map, the catalogue, rendering, styling      |
| `docs/ADMIN.md`         | The panel, the Workers, login, photos, the PDF, operations |
| `docs/DESIGN-SYSTEM.md` | Identity, tokens, colour roles, dark mode, motion, a11y    |
| `docs/CONVENTIONS.md`   | Naming, components, i18n, images, comments, commits        |
| `docs/SEO.md`           | URLs, metadata, prerendering, the Worker's crawler files   |
| `docs/TOOLING.md`       | Which skills and MCP servers to use                        |
