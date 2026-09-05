# Architecture

## Layers

Four layers. Dependencies point **down only** — ESLint enforces this, so a wrong import fails `bun run lint`.

```
features/   landing, catalog, not-found   one folder per business capability, lazy-loaded, preloaded after first render
   |
layout/     header, footer, switchers, WhatsApp button   the persistent site chrome
   |
shared/     reusable presentational UI, directives, pipes, utils
   |
core/       singletons and app-wide config: menu domain, i18n, theme, seo, images, routing
```

- `core` may not import `features` or `layout`.
- `shared` may not import `features` or `layout`.
- A feature may **never** import another feature. If two features need the same thing,
  it moves down into `shared` (presentational) or `core` (state/services).
- `layout` may use `core` and `shared`.

## Folder map

```
src/
  app/
    app.ts / app.html            root shell: skip link, header, outlet, footer, WhatsApp button
    app.config.ts                browser bootstrap
    app.config.server.ts         prerender bootstrap (swaps the translation loader)
    app.routes.ts                one route tree per language; each mounts every feature
    app.routes.server.ts         render mode per route, and the product slugs to prerender

    core/
      catalog/                   the menu domain (see "The menu" below)
      config/                    app.constants.ts, routes.ts, build-config.generated.ts
      i18n/                      loaders, LanguageService, generated keys
      images/                    NgOptimizedImage loader, width/sizes constants, generated manifest
      seo/                       SeoService (title, description, canonical, OG, JSON-LD)
      theme/                     ThemeService (light / dark / system)
      providers/core.providers.ts  the single provideCore() the app boots with

    shared/
      ui/                        wordmark, product-card, choice-group, empty-state — inputs in, outputs out
      directives/  pipes/  utils/

    layout/
      site-header/  site-footer/  theme-toggle/  language-switcher/  whatsapp-button/

    features/
      landing/
        landing.routes.ts        feature-owned routes
        pages/landing-page/      composes the sections below
        sections/                hero-section (video), catalog-section (the shelf), orders-section
      catalog/
        catalog.routes.ts        `:slug`
        pages/product-page/      the configurator: sizes, layers, fruit, live price, WhatsApp link
      not-found/

  styles/
    styles.css                   entry: layer order, tailwind, then the files below
    fonts.css + fonts/           self-hosted @font-face (Italiana, Karla, Parisienne); bundled and hashed
    tokens.css                   @theme design tokens
    base.css                     semantic aliases + element base + reduced motion
    patterns.css                 the shelf, the ornament, the two button shapes
    motion.css                   scroll-driven depth, CSS only

public/
  i18n/es.json  i18n/en.json     one file per language, fetched at runtime
  images/                        generated AVIF derivatives + JPEG social cards (committed)
  video/                         the hero loop, encoded once with ffmpeg (mp4 + webm, no audio)

.github/workflows/               CI: builds and publishes the GitHub Pages preview

assets-src/images/               original images, source for the pipeline
tests/                           every spec, mirroring src/app (no colocated tests)
scripts/                         config, i18n, palette, contrast, images, finalize, checks
docs/                            this folder
```

A feature folder is the unit of work: a route, its page, its sections, and its own routes file.
Adding a page means adding a folder, not editing five shared files.

## The menu

Everything a visitor can buy is data, never markup.

```
core/catalog/
  catalog.constants.ts   mould sizes, the default size, currency, price factors, extras
  catalog.model.ts       Product, OptionGroup, Selection — ids are the i18n keys
  catalog.data.ts        PRODUCTS: the whole menu, one object per piece, in shelf order
  selection.ts           defaultSelection(), toggleChoice(): pure, unit-tested
  pricing.ts             quote(), startingPrice(), formatPrice(): pure, unit-tested
  catalog.service.ts     lookup by slug
  order.service.ts       turns a selection into the pre-filled wa.me link
```

`ProductId`, `LayerId` and `FruitId` are `keyof typeof T.catalog.<group>`, so a piece cannot exist
without a name in every language, and a typo in the data file is a compile error, not a blank.

A piece lists only the groups it can vary: `layers` (flavor layers) and `fruits`, each with the
`options` on offer and the `defaults` it comes with. Defaults are included in the base price; each
choice beyond them costs the flat extra in `catalog.constants.ts`. A group set to `null` is simply
absent from the configurator. A group never goes empty.

The shelf and the product page both read `PRODUCTS`; the prerenderer reads it too, to know which
`/catalogo/<slug>` pages to emit; the sitemap is built from what was emitted. **Adding a piece** is
therefore: one entry in `catalog.data.ts`, its names in both locale files, the photo in
`assets-src/images/catalog/`, then `bun run images` and `bun run i18n`. Nothing else changes.

## Rendering

`outputMode: "static"` — every route is prerendered at build time into `dist/argelee/browser`.
There is no Node server. `app.config.server.ts` swaps the Transloco loader for one that imports the
locale JSON directly, because during prerender there is no HTTP server to fetch it from. Without
that swap the prerendered HTML would ship with empty strings and the page would have no SEO content.

Routes are per-language: `app.routes.ts` builds one tree per entry in `SUPPORTED_LANGUAGES`, with
the default language at the root and the rest path-prefixed (`/en`). A `CanActivateFn` applies the
route's language before render, so each prerendered file carries the right `<html lang>` and copy.

`app.routes.server.ts` prerenders everything by default. Parameterised routes need their values:
the product route gets them from `PRODUCTS` through `getPrerenderParams`. The bare `catalogo`
segment is marked `RenderMode.Client` on purpose — it is not a page, and left to the prerenderer
it would become a 404 rendered into a file and then listed in the sitemap. See `docs/SEO.md`.

## Styling

One source of truth, no component library.

1. `src/styles/tokens.css` declares design tokens in a Tailwind `@theme` block. Tailwind turns each
   into a CSS variable **and** a utility: `--color-brand-600` gives you `bg-brand-600`,
   `--text-eyebrow` gives you `text-eyebrow` with its size, line-height and letter-spacing.
2. `base.css` maps semantic roles (`--surface`, `--ink`, `--accent-text`, …) onto those tokens,
   once for light and once for dark, and exposes them as utilities through `@theme inline`.
3. Templates use only the semantic utilities. A component with a repeated shape (the two buttons,
   the shelf, the ornament) gets a class in `patterns.css`, composed with `@apply`.

Cascade layers decide ties. `styles.css` declares:

```css
@layer theme, base, components, utilities;
```

`patterns.css` and `motion.css` are deliberately **unlayered**, so their classes beat utilities on
the same element: `.shelf__card` owns its `animation` even if a utility is also present.

Dark mode is a class on `<html>`: `.arg-dark`, set by `ThemeService`. Two places must agree —
`DARK_THEME_CLASS` in `app.constants.ts` and the `@custom-variant dark` in `styles.css`.

## Generated files

Never edited by hand; each has one generator and one source.

| File                                      | Source                  | Command          |
| ----------------------------------------- | ----------------------- | ---------------- |
| `core/i18n/translation-keys.generated.ts` | `public/i18n/es.json`   | `bun run i18n`   |
| `core/images/image-manifest.generated.ts` | `assets-src/images/`    | `bun run images` |
| `core/config/build-config.generated.ts`   | `.env` / CI environment | `bun run config` |

`build-config.generated.ts` is git-ignored and written before every `start` and `build`.
