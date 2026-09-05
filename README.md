# Argelee

Landing page and made-to-order menu for **ArGelees**, artisan jellies. Visitors pick a piece, its
layers, its fruit and its size, and the order opens in WhatsApp already written out. Static,
multilingual, no backend, no component library.

**Angular 22** · **Tailwind CSS 4** · **Transloco** · **Bun**

## Requirements

- [Bun](https://bun.sh) 1.3+

## Setup

```bash
bun install
cp .env.example .env     # optional locally; CI sets the same variables
bun start                # http://localhost:4200
```

## Commands

| Command                     | What it does                                                                     |
| --------------------------- | -------------------------------------------------------------------------------- |
| `bun start`                 | Dev server with HMR                                                              |
| `bun run build`             | Prerenders every route to static HTML in `dist/argelee/browser`                  |
| `bun run verify`            | i18n + contrast + templates + lint + build. The gate before every commit.        |
| `bun run test`              | Vitest                                                                           |
| `bun run lint` / `lint:fix` | ESLint (type-aware)                                                              |
| `bun run format`            | Prettier, with Tailwind class sorting                                            |
| `bun run i18n`              | Regenerates typed translation keys from `public/i18n/es.json`                    |
| `bun run images`            | Builds responsive AVIF derivatives and social cards from `assets-src/`           |
| `bun run favicon`           | Outlines the wordmark's "A" into `favicon.svg`, `favicon.ico` and the touch icon |
| `bun run social-card`       | Draws the brand card behind the home page link preview, then runs `images`       |
| `bun run palette`           | Re-derives the colour scale from the brand hex                                   |
| `bun run contrast`          | WCAG AA check across every token pairing, both themes                            |

## Deploying

`bun run build` produces plain static files. Point any static host (Vercel, Netlify, Cloudflare
Pages, S3, nginx) at `dist/argelee/browser`. There is no server to run.

Set these in the host's environment:

| Variable         | Purpose                                                            |
| ---------------- | ------------------------------------------------------------------ |
| `SITE_ORIGIN`    | absolute origin for canonical, hreflang, og:image and sitemap URLs |
| `SITE_INDEXABLE` | `false` on previews — emits `noindex` and `Disallow: /`            |

Enable Brotli/gzip and long-lived caching on hashed assets — see `docs/SEO.md`.

### Public preview

Every push to `main` publishes a non-indexable preview to GitHub Pages at
<https://santiagovm2000.github.io/argelee/> via `.github/workflows/deploy-preview.yml`.

## Documentation

| File                    | Contents                                                |
| ----------------------- | ------------------------------------------------------- |
| `CLAUDE.md`             | Project rules, loaded by Claude Code every session      |
| `docs/ARCHITECTURE.md`  | Layers, folder map, the menu data, rendering, styling   |
| `docs/DESIGN-SYSTEM.md` | Identity, tokens, colour roles, dark mode, motion, a11y |
| `docs/CONVENTIONS.md`   | Naming, components, i18n, images, comments, commits     |
| `docs/SEO.md`           | Localized URLs, metadata, prerendering, crawler files   |
| `docs/TOOLING.md`       | Which skills and MCP servers to use                     |
