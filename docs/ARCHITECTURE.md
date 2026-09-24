# Architecture

Two Angular apps, two Cloudflare Workers, one shared domain module.

```
src/app/            the public site            prerendered, served by workers/site
projects/admin/     the owner's panel (SPA)     served by workers/admin behind a login
workers/            the two Workers + shared    Cloudflare runtime only, no Angular
src/app/core/catalog/  the catalogue domain    pure TypeScript, imported by all of the above
```

`docs/ADMIN.md` describes the panel, the Workers and the data flow end to end. This file is about
where code goes.

## Layers

Four layers inside each Angular app. Dependencies point **down only** — ESLint enforces this, so a
wrong import fails `bun run lint`.

```
features/   landing, catalog, links, not-found   one folder per business capability, lazy-loaded, preloaded after first render
   |
layout/     header, footer, theme toggle, WhatsApp button   the persistent chrome
   |
shared/     reusable presentational UI, directives, pipes, utils
   |
core/       singletons and app-wide config: catalogue domain, i18n, theme, seo, images, routing
```

- `core` may not import `features` or `layout`.
- `shared` may not import `features` or `layout`.
- A feature may **never** import another feature. If two features need the same thing,
  it moves down into `shared` (presentational) or `core` (state/services).
- `layout` may use `core` and `shared`.
- The panel (`projects/admin/`) imports the site's `core/catalog`, `core/images`, `core/config` and
  `core/i18n` constants through the `@core/*` alias, never a site feature, layout or component. It
  has its own `core/`, `layout/`, `shared/` and `features/` with the same rules.
- `workers/` imports `core/catalog` and `core/config` only; Workers have no Angular and no DOM.

## Folder map

```
src/
  app/
    app.ts / app.html            root shell: skip link, header, outlet, footer, WhatsApp button;
                                 refreshes the catalogue from /api/catalog once the app is stable
    app.config.ts                browser bootstrap
    app.config.server.ts         prerender bootstrap (swaps the translation loader)
    app.routes.ts                the route tree; each feature mounts its own routes file
    app.routes.server.ts         render mode per route, and the product ids to prerender

    core/
      catalog/                   the catalogue domain (see below) and pdf/ (the price-list template)
      config/                    app.constants.ts, routes.ts, build-config.generated.ts
      i18n/                      loaders, LanguageService, generated keys
      images/                    NgOptimizedImage loader, photo URLs, widths, generated manifest
      seo/                       SeoService (title, description, canonical, OG, JSON-LD)
      theme/                     ThemeService (light / dark / system)
      analytics/                 AnalyticsService: GA4 loader + the lead event WhatsApp links send
      providers/core.providers.ts  the single provideCore() the app boots with

    shared/
      ui/                        wordmark, product-card, choice-group, empty-state — inputs in, outputs out
      directives/                lead.ts: `a[argLead]` counts a WhatsApp click as a lead
      pipes/  utils/

    layout/
      site-header/  site-footer/  theme-toggle/  whatsapp-button/

    features/
      landing/                   hero-section (video), catalog-section (the shelf), orders-section
      catalog/                   `:id` → product-page: the configurator, live price, WhatsApp link
      links/  not-found/

  styles/
    styles.css                   entry: layer order, tailwind, then the files below
    fonts.css + fonts/           self-hosted @font-face (Italiana, Karla, Parisienne); bundled and hashed
    tokens.css                   @theme design tokens
    base.css                     semantic aliases + element base + reduced motion
    patterns.css                 the shelf, the ornament, buttons, fields, switch, controls
    motion.css                   scroll-driven depth, CSS only

projects/admin/                  the panel: same styles, its own locale and translation keys
  src/app/
    core/                        session (login state, guard), catalog (AdminCatalogService, drafts,
                                 photo upload, PdfService), config, i18n providers
    layout/                      admin-header, admin-menu (site link, logout, theme), theme-toggle
    shared/ui/amount-input/      masked money / percent / count field
    features/
      login/                     the login page
      catalog/                   the list: order, visibility, search, the save bar
      product/                   the piece form and the option-group editor
  public/i18n/es.json            the panel's texts

workers/
  site/                          argelees.com: /api/catalog, /photos, the PDF, sitemap, product shell, 404
  admin/                         admin.argelees.com: session, catalogue PUT, photos PUT, PDF job, status
  shared/                        HTTP helpers, security headers, store interfaces and their KV/R2 adapters
admin/wrangler.jsonc             the admin Worker's config (assets, KV, R2, rate limit, domain)
wrangler.jsonc                   the site Worker's config

public/
  i18n/es.json                   the site's texts, fetched at runtime
  fonts/                         the three woff2 files by stable URL, for the PDF renderer
  images/                        generated AVIF derivatives + JPEG social cards (brand assets only)
  icons/choices/  icons/orders/  glyphs for the flavour/fruit choices and the order conditions
  video/                         the hero loop, encoded once with ffmpeg (mp4 + webm, no audio)

.github/workflows/               CI: pulls the catalogue, verifies, deploys both Workers
assets-src/images/               original brand images, source for the pipeline
assets-src/catalog/seed/         the first catalogue document, its photos and the last hand-made PDF
tests/                           every spec, mirroring src/app, projects/admin and workers
scripts/                         config, i18n, palette, contrast, images, catalog-seed/pull, admin-credentials,
                                 catalog-pdf (local preview), dev (the local stack), finalize, checks
docs/                            this folder
```

A feature folder is the unit of work: a route, its page, its sections, and its own routes file.
Adding a page means adding a folder, not editing five shared files.

## The catalogue

Everything a visitor can buy is data, and that data lives in KV, not in the repo.

```
core/catalog/
  catalog.document.ts    CatalogDocument / StoredProduct: what the panel edits and KV stores
  catalog.validation.ts  the field readers parseCatalogDocument() is built from
  projection.ts          toPublicCatalog(): published pieces only, pricing collapsed to a price
  catalog.model.ts       Product, OptionGroup, Selection: what the site's views consume
  catalog.constants.ts   currency, price steps, KV keys, API paths, photo and PDF keys
  costing.ts             suggestedPrice(), effectiveMargin(): the panel's calculator, pure
  choices.ts             FLAVOUR_IDS / FRUIT_IDS: the fixed choice sets, typed from es.json
  localized-text.ts      the piece's texts in the requested language, falling back to Spanish
  selection.ts           defaultSelection(), toggleChoice(): pure, unit-tested
  pricing.ts             quote(), startingPrice(), formatPrice(): pure, unit-tested
  catalog.service.ts     the site's signal: starts from the snapshot, refresh() swaps in /api/catalog
  order.service.ts       turns a selection into the pre-filled wa.me link
  order-conditions.data.ts the order conditions grouped by theme, shared by the landing and the PDF
  catalog.snapshot.generated.ts  written by `bun run catalog:pull`, git-ignored
  pdf/                   renderCatalogHtml(): the whole price list as A4 HTML, plus its styles
```

A piece's `id` is a UUID minted by the panel; it is the URL segment (`/catalog/<id>`) and the
`track` key, and nothing depends on a slug. `FlavourId` and `FruitId` are `keyof typeof
T.catalog.<group>`, so the choice sets are fixed in code: each needs a name in `es.json` and a
glyph at `public/icons/choices/<id>.svg`, which the compiler and `check:structure` enforce. A piece names the flavours and the fruit it comes with, as information for the visitor: nothing on the site is selectable, the details are agreed on WhatsApp. A list set to `null` is simply not shown. A piece sold by the unit sets `serves: null` and its price is the price of
one.

The shelf and the product page read `CatalogService.products()`. The prerenderer reads the
snapshot to know which `/catalog/<id>` pages to emit; the site Worker serves the rest (a piece
published after the last build gets the client shell with its meta injected) and builds the
sitemap from KV. **Adding a piece** is done in the panel. Code changes only when the shape
changes: a new field goes into `catalog.document.ts`, its reader into `catalog.validation.ts`, the
projection, the panel's draft (`projects/admin/.../product-draft.ts`) and form, the seed, and a
test in `tests/core/catalog/catalog.document.spec.ts`.

## Rendering

`outputMode: "static"` — every route is prerendered at build time into `dist/argelee/browser`.
There is no Node server. `app.config.server.ts` swaps the Transloco loader for one that imports the
locale JSON directly, because during prerender there is no HTTP server to fetch it from. Without
that swap the prerendered HTML would ship with empty strings and the page would have no SEO content.

The site is Spanish only: `SUPPORTED_LANGUAGES` has one entry and every route lives at the root.
The language plumbing (`LanguageService`, `localizedUrl()`) stays so a second language would be a
constant and a locale file, not a rewrite.

`app.routes.server.ts` prerenders everything by default. The product route gets its ids from the
catalogue snapshot through `getPrerenderParams`. The bare `catalog` segment is marked
`RenderMode.Client` on purpose — it is not a page, and left to the prerenderer it would become a
404 rendered into a file. See `docs/SEO.md`.

In the browser, `app.ts` waits for the application to be stable, then asks `CatalogService` to
refresh from `/api/catalog`. Hydration therefore always matches the prerendered HTML, and the
live menu replaces it a moment later.

## Styling

One source of truth, no component library, shared by both apps (`angular.json` points the panel at
the same `src/styles/styles.css`).

1. `src/styles/tokens.css` declares design tokens in a Tailwind `@theme` block. Tailwind turns each
   into a CSS variable **and** a utility: `--color-brand-600` gives you `bg-brand-600`,
   `--text-eyebrow` gives you `text-eyebrow` with its size, line-height and letter-spacing.
2. `base.css` maps semantic roles (`--surface`, `--ink`, `--accent-text`, …) onto those tokens,
   once for light and once for dark, and exposes them as utilities through `@theme inline`.
3. Templates use only the semantic utilities. A component with a repeated shape (the buttons, the
   shelf, the ornament, the form field, the switch, the panel's small controls) gets a class in
   `patterns.css`, composed with `@apply`.

Cascade layers decide ties. `styles.css` declares:

```css
@layer theme, base, components, utilities;
```

`patterns.css` and `motion.css` are deliberately **unlayered**, so their classes beat utilities on
the same element: `.shelf__card` owns its `animation` even if a utility is also present. The flip
side: a utility cannot override a property a pattern class sets. Vary a pattern with a modifier
class (`.field--search`, `.field--prefixed`, `.button--compact`), not with a utility.

Dark mode is a class on `<html>`: `.arg-dark`, set by `ThemeService`. Two places must agree —
`DARK_THEME_CLASS` in `app.constants.ts` and the `@custom-variant dark` in `styles.css`.

## Generated files

Never edited by hand; each has one generator and one source.

| File                                                             | Source                               | Command                |
| ---------------------------------------------------------------- | ------------------------------------ | ---------------------- |
| `core/i18n/translation-keys.generated.ts`                        | `public/i18n/es.json`                | `bun run i18n`         |
| `projects/admin/src/app/core/i18n/translation-keys.generated.ts` | `projects/admin/public/i18n/es.json` | `bun run i18n`         |
| `core/images/image-manifest.generated.ts`                        | `assets-src/images/`                 | `bun run images`       |
| `core/config/build-config.generated.ts`                          | `.env` / CI environment              | `bun run config`       |
| `core/catalog/catalog.snapshot.generated.ts`                     | KV (or the local dev state)          | `bun run catalog:pull` |
| `worker-configuration.d.ts`, `admin/worker-configuration.d.ts`   | the two `wrangler.jsonc`             | `bun run config`       |
| `public/_headers`                                                | `workers/shared/security-headers.ts` | `bun run finalize`     |

The snapshot, the build config and the Worker types are git-ignored and written before every
`start` and `build`.
