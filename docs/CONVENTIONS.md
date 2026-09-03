# Conventions

## Naming

Files and folders are `kebab-case`. Classes are `PascalCase`. Constants are `SCREAMING_SNAKE_CASE`.

| Kind      | File                                    | Symbol              |
| --------- | --------------------------------------- | ------------------- |
| Component | `hero-section.ts` + `hero-section.html` | `HeroSection`       |
| Service   | `language.service.ts`                   | `LanguageService`   |
| Constants | `theme.constants.ts`                    | `PRIMENG_CSS_LAYER` |
| Routes    | `landing.routes.ts`                     | `landingRoutes`     |
| Generated | `translation-keys.generated.ts`         | —                   |
| Spec      | `i18n.constants.spec.ts`                | —                   |

Never put the project name in a filename. Component selectors use the `arg-` prefix
(`arg-hero-section`); attribute directives use camelCase with the same prefix.

## Components

- `name.ts` + `name.html`. No inline templates, no component stylesheet.
- Presentational component: inputs in, outputs out, no injected feature services.
- Anything that fetches, persists, computes across screens, or talks to the platform is a service.
- Expose translation keys as `protected readonly t = T;` so the template can reach them.
- A page composes sections; a section is small enough to read in one screen.

```ts
@Component({
  selector: 'arg-hero-section',
  imports: [TranslocoDirective, ButtonModule],
  templateUrl: './hero-section.html',
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
meta.<page>.title / .description   page metadata
a11y.*                             screen-reader-only strings
common.actions.*                   verbs reused everywhere
common.language.*                  language names
navigation.*                       nav labels
<feature>.<section>.*              feature copy
errors.*                           error and empty states
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
</ng-container>
```

Renaming a key becomes a compile error instead of a blank string in production. Never type a key as
a string literal, and never build one by concatenation.

`bun run check:templates` fails on any literal text between tags and on user-facing attributes
(`alt`, `title`, `placeholder`, `aria-label`, `aria-description`) that hold static words.

Adding a language: add the code to `SUPPORTED_LANGUAGES` and a tag to `LANGUAGE_TAGS` in
`core/i18n/i18n.constants.ts`, add `public/i18n/<code>.json`, run `bun run i18n`. Nothing else changes.

## Images

Originals go in `assets-src/images/<category>/<name>.<ext>` and are never served.
`bun run images` emits responsive AVIF into `public/images/<category>/` and writes a typed manifest.

- Output naming is `<name>-<width>w.avif`, driven by `IMAGE_WIDTHS`.
- Source naming is `kebab-case`, describing content not appearance: `founder-portrait.jpg`,
  not `img2.jpg` or `blue-photo.jpg`.
- Categories in use: `brand/` (logos, marks), `og/` (social cards), plus one per page section.

Use the manifest so width and height are always right and never cause layout shift:

```html
<img
  [ngSrc]="images.heroProduct.path"
  [width]="images.heroProduct.width"
  [height]="images.heroProduct.height"
  [placeholder]="images.heroProduct.placeholder"
  sizes="(max-width: 768px) 100vw, 50vw"
  priority
  [alt]="translate(t.landing.hero.imageAlt)"
/>
```

`priority` goes on the LCP image only — usually one per page. Everything else lazy-loads by default.
SVGs (logos, icons) are inlined or referenced directly; they do not go through the pipeline and do
not use `NgOptimizedImage`.

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

`0`, `1` and `-1` are exempt. Route paths live in `core/config/routes.ts` and templates bind
`[routerLink]="links.home"`, never a literal `"/"`.

## Tests

Every test lives under `tests/`, mirroring the source tree. Nothing is colocated with source.

```
src/app/core/i18n/i18n.constants.ts   ->   tests/core/i18n/i18n.constants.spec.ts
src/app/features/landing/...          ->   tests/features/landing/...
```

Import the code under test through the path aliases, never a relative climb:

```ts
import { isSupportedLanguage } from '@core/i18n/i18n.constants';
```

The runner is configured with `include: ["../tests/**/*.spec.ts"]` — the glob resolves against
`sourceRoot` (`src/`), not the project root, which is why it starts with `../`. Schematics run with
`skipTests: true`, so `ng generate` never drops a spec beside the file it created; write the spec in
`tests/` yourself. `bun run check:structure` fails the build if a spec appears anywhere else.

## Commits

Conventional Commits: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`, `test:`.
Run `bun run verify` first — it is the same gate CI uses.
