# Architecture

## Layers

Four layers. Dependencies point **down only** — ESLint enforces this, so a wrong import fails `bun run lint`.

```
features/   landing, not-found, ...   one folder per business capability, lazy-loaded
   |
layout/     header, footer, switchers  the persistent site chrome
   |
shared/     reusable presentational UI, directives, pipes, utils
   |
core/       singletons and app-wide config: i18n, theme, seo, images, routing
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
    app.ts / app.html            root shell: skip link, header, outlet, footer
    app.config.ts                browser bootstrap
    app.config.server.ts         prerender bootstrap (swaps the translation loader)
    app.routes.ts                root table, one lazy entry per feature
    app.routes.server.ts         render mode per route

    core/
      config/                    app.constants.ts, routes.ts, license.generated.ts
      i18n/                      locales, loaders, LanguageService, generated keys
      images/                    NgOptimizedImage loader + width constants
      seo/                       SeoService (title, description, canonical, OG)
      theme/                     tokens <-> PrimeNG preset, ThemeService
      providers/core.providers.ts  the single provideCore() the app boots with

    shared/
      ui/                        presentational components, no business logic
      directives/  pipes/  utils/
      images/image-manifest.generated.ts

    layout/
      site-header/  site-footer/  theme-toggle/  language-switcher/

    features/
      landing/
        landing.routes.ts        feature-owned routes
        pages/                   one component per route
        sections/                hero-section, ... the page is a composition of these
        services/  models/       added when the feature needs them
      not-found/

  styles/
    styles.css                   entry: layer order, tailwind, primeui, primeicons
    tokens.css                   @theme design tokens
    base.css                     semantic aliases + element base + reduced motion

public/
  i18n/es.json  i18n/en.json     one file per language, fetched at runtime
  images/                        generated AVIF derivatives (committed)

assets-src/images/               original images, source for the pipeline
scripts/                         i18n, palette, contrast, images, license, templates
docs/                            this folder
```

A feature folder is the unit of work: a route, its page, its sections, and its own routes file.
Adding a page means adding a folder, not editing five shared files.

## Rendering

`outputMode: "static"` — every route is prerendered at build time into `dist/argelee/browser`.
There is no Node server. `app.config.server.ts` swaps the Transloco loader for one that imports the
locale JSON directly, because during prerender there is no HTTP server to fetch it from. Without
that swap the prerendered HTML would ship with empty strings and the page would have no SEO content.

Adding a route that must be prerendered: add it to the feature's routes file. `app.routes.server.ts`
prerenders everything by default.

## The Tailwind / PrimeNG seam

Two styling systems share one source of truth.

1. `src/styles/tokens.css` declares design tokens in a Tailwind `@theme` block. Tailwind turns each
   into a CSS variable **and** a utility: `--color-brand-500` gives you `bg-brand-500`.
2. `core/theme/theme.preset.ts` maps PrimeNG's tokens onto the _same_ CSS variables.

So `<p-button>` and a `bg-accent` div resolve the same colour, and dark mode is implemented once.

Cascade layers decide ties. `styles.css` declares:

```css
@layer theme, base, primeng, components, utilities;
```

PrimeNG registers into the `primeng` layer via `providePrimeNG({ theme: { options: { cssLayer } } })`.
It must sit after `base` and before `utilities`, or PrimeNG's component CSS outranks Tailwind and a
utility class on a PrimeNG component silently does nothing.

Dark mode is a class on `<html>`: `.arg-dark`, set by `ThemeService`. Three places must agree —
`DARK_THEME_CLASS`, `PRIMENG_DARK_MODE_SELECTOR`, and the `@custom-variant dark` in `styles.css`.
The first two are derived from the third by constant, so change it in `app.constants.ts`.

## Generated files

Never edited by hand; each has one generator and one source.

| File                                        | Source                        | Command           |
| ------------------------------------------- | ----------------------------- | ----------------- |
| `core/i18n/translation-keys.generated.ts`   | `public/i18n/es.json`         | `bun run i18n`    |
| `shared/images/image-manifest.generated.ts` | `assets-src/images/`          | `bun run images`  |
| `core/config/license.generated.ts`          | `PRIMENG_LICENSE_KEY` env var | `bun run license` |

The license file is git-ignored and written before every `start` and `build`.
