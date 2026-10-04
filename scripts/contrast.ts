/**
 * WCAG contrast guard. Run with `bun run contrast`.
 *
 * Reads the ACTUAL token values out of src/styles/*.css, resolves the var()
 * chains, and checks every semantic pairing in both light and dark. Retuning a
 * token that quietly breaks legibility fails here instead of in an audit.
 *
 * Thresholds: 4.5 for body text, 3.0 for large text and non-text boundaries
 * (WCAG 2.2 SC 1.4.3 and 1.4.11).
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseOklch, type Rgb } from './color';

const STYLES = resolve(import.meta.dir, '..', 'src', 'styles');

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (v: number): number => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (light + 0.05) / (dark + 0.05);
}

/** Collects `--name: value;` declarations, keyed by the block they appear in. */
function collectDeclarations(css: string, blockSelector: string): Map<string, string> {
  const map = new Map<string, string>();
  const blockStart = css.indexOf(blockSelector);
  if (blockStart === -1) return map;
  const open = css.indexOf('{', blockStart);
  let depth = 0;
  let end = open;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = css.slice(open + 1, end);
  for (const match of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    map.set(match[1]!.trim(), match[2]!.trim());
  }
  return map;
}

const tokensCss = readFileSync(join(STYLES, 'tokens.css'), 'utf8');
const baseCss = readFileSync(join(STYLES, 'base.css'), 'utf8');

const scales = collectDeclarations(tokensCss, '@theme {');
const lightVars = collectDeclarations(baseCss, ':root {');
const darkVars = collectDeclarations(baseCss, '.arg-dark {');

/** A scene's roles as they apply in a theme: the theme, then the scene, then its dark override. */
function sceneVars(
  scene: string,
  themeVars: Map<string, string>,
  dark: boolean,
): Map<string, string> {
  const merged = new Map([...themeVars, ...collectDeclarations(baseCss, `.${scene} {`)]);
  if (!dark) return merged;
  return new Map([...merged, ...collectDeclarations(baseCss, `.arg-dark .${scene} {`)]);
}

function resolveColor(name: string, themeVars: Map<string, string>): Rgb {
  let value = themeVars.get(name) ?? scales.get(name);
  for (let hops = 0; value?.startsWith('var(') && hops < 10; hops++) {
    const inner = value.slice(4, value.indexOf(')')).trim();
    value = themeVars.get(inner) ?? scales.get(inner);
  }
  if (value === undefined) throw new Error(`could not resolve ${name}`);
  const rgb = parseOklch(value);
  if (rgb === null) throw new Error(`${name} is not an oklch() value: ${value}`);
  return rgb;
}

type Check = readonly [foreground: string, background: string, minimum: number, label: string];

const PAGE_CHECKS: readonly Check[] = [
  ['--ink', '--surface', 4.5, 'body text on page'],
  ['--ink-muted', '--surface', 4.5, 'secondary text on page'],
  ['--ink-subtle', '--surface', 3.0, 'subtle/large text on page'],
  ['--ink', '--surface-raised', 4.5, 'body text on raised card'],
  ['--ink-muted', '--surface-raised', 4.5, 'secondary text on raised card'],
  ['--ink', '--surface-sunken', 4.5, 'body text on sunken area'],
  ['--accent-ink', '--accent', 4.5, 'label on primary button'],
  ['--accent-ink', '--accent-hover', 4.5, 'label on hovered primary button'],
  ['--accent-text', '--surface', 4.5, 'brand-coloured text/link on page'],
  ['--accent-text', '--surface-raised', 4.5, 'brand-coloured text on a card'],
  ['--focus-ring', '--surface', 3.0, 'focus ring on page'],
  ['--line-strong', '--surface', 3.0, 'interactive boundary on page'],
  ['--ink', '--surface-tint', 4.5, 'body text on tinted section'],
  ['--ink-muted', '--surface-tint', 4.5, 'secondary text on tinted section'],
  ['--accent-text', '--surface-tint', 4.5, 'brand-coloured text on tinted section'],
  ['--line-strong', '--surface-tint', 3.0, 'interactive boundary on tinted section'],
  ['--focus-ring', '--surface-tint', 3.0, 'focus ring on tinted section'],
  ['--wordmark', '--surface', 3.0, 'logo (large graphic) on page'],
  ['--ink', '--surface-selected', 4.5, 'label on a selected chip'],
  ['--ink', '--surface-hover', 4.5, 'label on a hovered control'],
  ['--accent-text', '--surface-raised', 3.0, 'selected chip border on a panel'],
  ['--sticker-ink', '--sticker', 4.5, 'price on its round sticker'],
  ['--critical', '--surface', 4.5, 'error text on page'],
  ['--critical', '--surface-raised', 4.5, 'error text on a panel'],
  ['--color-neutral-0', '--color-whatsapp-deep', 4.5, 'label on the WhatsApp button'],
  ['--color-neutral-0', '--color-instagram', 4.5, 'label on the Instagram button'],
  ['--color-neutral-0', '--color-instagram-hover', 4.5, 'label on the Instagram button, hovered'],
];

const SCENE_CHECKS: readonly Check[] = [
  ['--ink', '--surface', 4.5, 'text on the scene'],
  ['--ink-muted', '--surface', 4.5, 'secondary text on the scene'],
  ['--accent-text', '--surface', 4.5, 'link on the scene'],
  ['--focus-ring', '--surface', 3.0, 'focus ring on the scene'],
  ['--line-strong', '--surface', 3.0, 'outlined button on the scene'],
  ['--wordmark', '--surface', 3.0, 'logo (large graphic) on the scene'],
  ['--ink', '--surface-hover', 4.5, 'label on a hovered control on the scene'],
  ['--accent-ink', '--accent', 4.5, 'label on the primary button'],
  ['--accent-ink', '--surface-raised', 4.5, 'label on the white button on the scene'],
];

const SCENES = ['water', 'lagoon'] as const;

let failures = 0;

function run(title: string, vars: Map<string, string>, checks: readonly Check[]): void {
  console.log(`\n  ${title}`);
  for (const [fg, bg, minimum, label] of checks) {
    const ratio = contrastRatio(resolveColor(fg, vars), resolveColor(bg, vars));
    const passed = ratio >= minimum;
    if (!passed) failures++;
    console.log(
      `    ${passed ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2)}:1  (min ${minimum.toFixed(1)})  ${label}`,
    );
  }
}

/** The water pattern is drawn over text, so it must only ever push away from the text colour. */
function checkCaustic(title: string, vars: Map<string, string>): void {
  const ink = resolveColor('--ink', vars);
  const field = contrastRatio(ink, resolveColor('--surface', vars));
  const pattern = contrastRatio(ink, resolveColor('--caustic', vars));
  const passed = pattern >= field;
  if (!passed) failures++;
  console.log(
    `    ${passed ? 'PASS' : 'FAIL'}  ${pattern.toFixed(2)}:1 >= ${field.toFixed(2)}:1  water pattern only raises contrast (${title})`,
  );
}

for (const [themeName, themeVars, dark] of [
  ['light', lightVars, false],
  ['dark', darkVars, true],
] as const) {
  run(themeName, themeVars, PAGE_CHECKS);
  for (const scene of SCENES) {
    const vars = sceneVars(scene, themeVars, dark);
    run(`${themeName} · ${scene}`, vars, SCENE_CHECKS);
    checkCaustic(`${themeName} · ${scene}`, vars);
  }
}

if (failures > 0) {
  console.error(`\ncontrast: ${failures} pairing(s) below the WCAG AA floor.`);
  process.exit(1);
}
console.log('\ncontrast: all pairings pass WCAG AA.');
