# Conventions

## Naming

Files and folders are `kebab-case`. Classes are `PascalCase`. Constants are `SCREAMING_SNAKE_CASE`.

| Kind      | File                                    | Symbol            |
| --------- | --------------------------------------- | ----------------- |
| Component | `hero-section.ts` + `hero-section.html` | `HeroSection`     |
| Service   | `language.service.ts`                   | `LanguageService` |
| Constants | `catalog.constants.ts`                  | `PORTION_SIZES`   |
| Data      | `catalog.data.ts`                       | `PRODUCTS`        |
| Routes    | `landing.routes.ts`                     | `landingRoutes`   |
| Generated | `translation-keys.generated.ts`         | —                 |
| Spec      | `i18n.constants.spec.ts`                | —                 |

Never put the project name in a filename. Component selectors use the `arg-` prefix
(`arg-hero-section`); attribute directives use camelCase with the same prefix.

## Components

- `name.ts` + `name.html`. No inline templates, no component stylesheet.
- Presentational component: inputs in, outputs out, no injected feature services.
- Anything that fetches, persists, computes across screens, or talks to the platform is a service.
  Pure calculations (pricing, selection rules) are plain exported functions, which is what makes
  them trivial to unit-test.
- Expose translation keys as `protected readonly t = T;` so the template can reach them.
- A page composes sections; a section is small enough to read in one screen.
- A component with a block-level template declares it: `host: { class: 'block' }`.
- Native elements first. A button is a `<button>` with utilities; a choice is a native radio or
  checkbox styled through its label. No library components, no icon fonts.

```ts
@Component({
  selector: 'arg-hero-section',
  imports: [TranslocoDirective, NgOptimizedImage],
  templateUrl: './hero-section.html',
  host: { class: 'block' },
})
export class HeroSection {
  protected readonly t = T;
}
```

## i18n

One JSON per language in `public/i18n/`. `es.json` is the **source of truth**; every other locale
must contain exactly the same key set or the build fails.

Keys are grouped by where they are used, not by word:

```
meta.<page>.title / .description   page metadata; may carry {{params}}
a11y.*                             screen-reader-only strings
common.language.*                  language names
navigation.*                       nav labels
landing.<section>.*                landing copy
catalog.products.<id>.*            name, note, description, imageAlt — the id is the piece's slug
catalog.layers.* / fruits.*        option labels — the key is the option's id
catalog.groups / hints / customizer / order   the configurator and the WhatsApp message
footer.*  errors.*                 chrome and empty states
```

After editing any locale JSON, run `bun run i18n`. That regenerates `T`, a nested const whose leaves
are the dot paths:

```ts
T.landing.hero.headline; // 'landing.hero.headline'
```

Use it in templates through the `*transloco` directive:

```html
<ng-container *transloco="let translate">
  <h1>{{ translate(t.landing.hero.headline) }}</h1>
  <p>{{ translate(t.catalog.card.fromPrice, { price: price() }) }}</p>
</ng-container>
```

Renaming a key becomes a compile error instead of a blank string in production. Never type a key as
a string literal, and never build one by concatenation. Piece, layer and fruit ids are typed as
`keyof typeof T.catalog.<group>`, so the locale file is also the registry of what exists.

`bun run check:templates` fails on any literal text between tags and on user-facing attributes
(`alt`, `title`, `placeholder`, `aria-label`, `aria-description`) that hold static words.

Adding a language: add the code to `SUPPORTED_LANGUAGES` and a tag to `LANGUAGE_TAGS` in
`core/i18n/i18n.constants.ts`, add `public/i18n/<code>.json`, run `bun run i18n`. Nothing else changes.

## The menu

Pieces are data in `core/catalog/catalog.data.ts`, never markup. Each entry names its image by
manifest key, its base price at the default size, the sizes it comes in, and only the option
groups it can vary, each with its `options` and the `defaults` it comes with. See "The menu" in
`docs/ARCHITECTURE.md` for the full add-a-piece recipe.

Prices are money in whole currency units; `formatPrice()` is the only place they become text.
Never format a price in a template.

## Images

Originals go in `assets-src/images/<category>/<name>.<ext>` and are never served.
`bun run images` emits responsive AVIF plus one JPEG social card into `public/images/<category>/`
and writes a typed manifest to `core/images/image-manifest.generated.ts`.

`bun run favicon` outlines the "A" of the wordmark from the bundled Parisienne file and paints it in
the wordmark wine with no background, straight from the tokens: `public/favicon.svg` (it follows the
browser's colour scheme like the wordmark follows the site's), a transparent `favicon.ico`, and
`apple-touch-icon.png` on a pale brand tile because iOS refuses transparency. Re-run it after
changing the wordmark font or the tokens.

- Output naming is `<name>-<width>w.avif` and `<name>-social.jpg`, driven by `IMAGE_WIDTHS` and
  `OG_IMAGE_SIZE`.
- Manifest paths are relative (`images/catalog/...`) so they resolve against `<base href>` and
  survive a subpath deployment.
- Source naming is `kebab-case`, describing content not appearance: `tropical-fruit-ring.jpg`,
  not `img2.jpg` or `red-photo.jpg`.
- Categories in use: `catalog/` (product photos); add `brand/` for marks and `hero/` for hero art
  when they exist.
- Photos should be the camera originals. WhatsApp re-encodes to ~1280px, which caps the derivatives.

Use the manifest so dimensions and the blur placeholder are always right. Framed photos use `fill`
inside a sized container, `ngSrcset` from `srcsetFor()` so the browser never asks for a width the
pipeline did not emit, and a `sizes` hint from `IMAGE_SIZES`:

```html
<div class="relative aspect-[4/5] overflow-hidden rounded-card">
  <img
    [ngSrc]="image().path"
    fill
    [ngSrcset]="srcset()"
    [placeholder]="image().placeholder"
    [sizes]="sizes"
    class="object-cover"
    [alt]="translate(t.catalog.products[product().id].imageAlt)"
  />
</div>
```

`priority` goes on the LCP image only — one per page. Everything else lazy-loads by default.
SVGs (icons) are inlined; they do not go through the pipeline and do not use `NgOptimizedImage`.

## Video

The hero loop lives in `public/video/` as `hero.mp4` (H.264, yuv420p, faststart) and `hero.webm`
(VP9), both without audio, encoded once from the original with ffmpeg. Its poster frame goes
through the image pipeline like any photo (`assets-src/images/hero/poster.jpg`), is the page's
LCP image, and is what reduced-motion visitors see. The `<video>` is `autoplay muted loop
playsinline`, `aria-hidden`, and its sources are constants, never literals in the template.

## Comments

Brief, English, and only on functions, methods and classes — say _why_, not _what_.
Never comment a variable, constant, or parameter; rename it instead.

```ts
/** Resolves the startup language: stored choice, then browser preference, then default. */
initialize(): void { ... }
```

## Constants

A number or string that carries meaning gets a name. Scope decides where:

- used across the app -> `core/config/app.constants.ts`
- used by one subsystem -> that subsystem's `*.constants.ts`
- used in one function -> a local `const` at the top of the file

`0`, `1` and `-1` are exempt, and so are `*.constants.ts` and `*.data.ts` files — they are where a
number gets its name. Route paths live in `core/config/routes.ts` and templates bind
`[routerLink]="language.homeUrl()"` or `[fragment]="sections.catalog"`, never a literal.

## Tests

Every test lives under `tests/`, mirroring the source tree. Nothing is colocated with source.

```
src/app/core/i18n/i18n.constants.ts   ->   tests/core/i18n/i18n.constants.spec.ts
src/app/core/catalog/pricing.ts       ->   tests/core/catalog/pricing.spec.ts
```

Import the code under test through the path aliases, never a relative climb:

```ts
import { quote } from '@core/catalog/pricing';
```

The runner is configured with `include: ["../tests/**/*.spec.ts"]` — the glob resolves against
`sourceRoot` (`src/`), not the project root, which is why it starts with `../`. Schematics run with
`skipTests: true`, so `ng generate` never drops a spec beside the file it created; write the spec in
`tests/` yourself. `bun run check:structure` fails the build if a spec appears anywhere else.

## Commits

Conventional Commits: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`, `test:`.
Run `bun run verify` first — it is the same gate CI uses.
