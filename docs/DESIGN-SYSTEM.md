# Design system

Read the `frontend-design` skill before building or reshaping UI. This file is the token contract;
that skill is the taste.

## No AI slop

The house style is _specific_, not _safe_. Three looks read instantly as machine-generated and are
banned unless someone argues them on the merits for this brand:

- cream background (#F4F1EA-ish) + high-contrast serif display + terracotta accent
- near-black background with a single acid-green or vermilion accent
- broadsheet layout: hairline rules, zero radius, dense newspaper columns

Also avoid, unless the content genuinely calls for it: a big-number-plus-tiny-label hero,
`01 / 02 / 03` step markers where the content is not a sequence, gradient text, and decorative
motion scattered across the page. Structural devices must encode something true about the content.

Spend boldness in one place. One signature element that the page is remembered by; everything around
it quiet and disciplined.

## Tokens

`src/styles/tokens.css` is the only place raw values are written. Tailwind v4 turns each `@theme`
entry into both a CSS variable and a utility class.

| Group       | Tokens                                                                  | Utility            |
| ----------- | ----------------------------------------------------------------------- | ------------------ |
| Type family | `--font-display`, `--font-body`, `--font-mono`                          | `font-display`     |
| Type scale  | `caption`, `body-sm`, `body`, `body-lg`, `title`, `headline`, `display` | `text-headline`    |
| Brand       | `--color-brand-50` … `950`                                              | `bg-brand-500`     |
| Neutral     | `--color-neutral-0` … `950`                                             | `text-neutral-600` |
| Radius      | `--radius-control`, `--radius-card`, `--radius-panel`                   | `rounded-card`     |
| Elevation   | `--shadow-raised`, `--shadow-overlay`                                   | `shadow-raised`    |
| Layout      | `--container-content`, `--container-prose`                              | `max-w-content`    |
| Motion      | `--duration-instant/quick/settled/deliberate`, `--ease-out-quart`       | `duration-quick`   |

Never write a hex, a px font-size, or a ms duration in a template. If a value is missing, add a token.

## Colour roles

The primary is **#3AC5F7**, a bright cyan. The full scale is derived from it in OKLCH by
`scripts/palette.ts` — change `BRAND_HEX` there and run `bun run palette`, never hand-edit a step.
Neutrals carry a trace of the same hue so greys belong to the palette.

Bright cyan has one hard consequence: **white text on it fails WCAG AA**. The brand is therefore
split into roles that must not be substituted for one another:

| Token                | Use                                        | Never                     |
| -------------------- | ------------------------------------------ | ------------------------- |
| `bg-accent`          | fill of primary buttons and highlights     | as text on a page surface |
| `text-accent-ink`    | the label _on_ an accent fill (dark)       | on the page background    |
| `text-accent-text`   | brand-coloured text and links on a surface | as a large fill           |
| `--color-focus-ring` | the focus outline                          | anything else             |

Surfaces and ink use semantic aliases that flip between themes, defined in `base.css`:

`bg-surface`, `bg-surface-raised`, `bg-surface-sunken`, `text-ink`, `text-ink-muted`,
`text-ink-subtle`, `border-line` (decorative), `border-line-strong` (interactive boundary, 3:1).

**Always use the semantic alias, never a raw scale step.** `bg-surface`, not `bg-neutral-0`.
That is what makes dark mode two blocks in `base.css` instead of a rewrite of every template.

`bun run contrast` resolves the real token values and fails below the AA floor. It is part of
`bun run verify`, so a retuned colour cannot quietly break legibility.

## Dark mode

Three states: `light`, `dark`, and `system` (the default, which keeps following the OS).
`ThemeService` toggles `.arg-dark` on `<html>`; Tailwind's `dark:` variant and PrimeNG's dark tokens
both key off that class. Design both themes at the same time — never light-first with dark patched on.

## Responsive

Mobile-first, no exceptions. Every screen works from 320px.

- Layout containers use `max-w-content` / `max-w-prose` plus padding, never a fixed width.
- Type scales with `clamp()`, so no breakpoint-specific font sizes are needed.
- Verify at 360, 768, 1280 and 1920. Check that nothing overflows horizontally at 320.
- Tailwind breakpoints match `BREAKPOINTS` in `core/config/app.constants.ts`: 640 / 768 / 1024 / 1280.
- Touch targets are at least 44x44 CSS px.

## Accessibility floor

Not optional, and cheaper to keep than to retrofit:

- Contrast passes AA (`bun run contrast`).
- Focus is always visible — `:focus-visible` is styled in `base.css`; never remove the outline.
- `prefers-reduced-motion: reduce` zeroes animation globally; do not opt an element out of it.
- Real semantics: one `h1` per page, headings in order, buttons for actions, links for navigation.
- Every interactive control has an accessible name, sourced from a translation key.
- The skip link in `app.html` stays first in the DOM.

## Motion

Motion has to mean something: it shows causality, or reveals hierarchy, or acknowledges input.
Ambient drifting and breathing loops read as filler. Use the duration tokens — `quick` for hover and
state changes, `settled` for entrances, `deliberate` reserved for one orchestrated moment.

## PrimeNG

Components resolve their colours from the tokens above through `core/theme/theme.preset.ts`.
Add a mapping there only when a PrimeNG component needs it; anything that is not a PrimeNG component
belongs in `tokens.css`. Import components individually (`import { ButtonModule } from 'primeng/button'`)
so unused ones stay out of the bundle. Reach for a plain element with Tailwind before pulling in a
PrimeNG component for something trivial — the landing page should not ship a widget library it barely uses.
