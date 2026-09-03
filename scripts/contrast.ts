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

const STYLES = resolve(import.meta.dir, '..', 'src', 'styles');

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function oklchToRgb(l: number, c: number, hDeg: number): Rgb {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const bb = c * Math.sin(h);

  const lms = [
    (l + 0.3963377774 * a + 0.2158037573 * bb) ** 3,
    (l - 0.1055613458 * a - 0.0638541728 * bb) ** 3,
    (l - 0.0894841775 * a - 1.291485548 * bb) ** 3,
  ] as const;

  const toGamma = (v: number): number => {
    const clamped = Math.min(1, Math.max(0, v));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  };

  return {
    r: toGamma(4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2]),
    g: toGamma(-1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2]),
    b: toGamma(-0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2]),
  };
}

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

function resolveColor(name: string, themeVars: Map<string, string>): Rgb {
  let value = themeVars.get(name) ?? scales.get(name);
  for (let hops = 0; value?.startsWith('var(') && hops < 10; hops++) {
    const inner = value.slice(4, value.indexOf(')')).trim();
    value = themeVars.get(inner) ?? scales.get(inner);
  }
  if (value === undefined) throw new Error(`could not resolve ${name}`);
  const match = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/.exec(value);
  if (match === null) throw new Error(`${name} is not an oklch() value: ${value}`);
  return oklchToRgb(Number(match[1]), Number(match[2]), Number(match[3]));
}

type Check = readonly [foreground: string, background: string, minimum: number, label: string];

const CHECKS: readonly Check[] = [
  ['--ink', '--surface', 4.5, 'body text on page'],
  ['--ink-muted', '--surface', 4.5, 'secondary text on page'],
  ['--ink-subtle', '--surface', 3.0, 'subtle/large text on page'],
  ['--ink', '--surface-raised', 4.5, 'body text on raised card'],
  ['--ink', '--surface-sunken', 4.5, 'body text on sunken area'],
  ['--accent-ink', '--accent', 4.5, 'label on primary button'],
  ['--accent-text', '--surface', 4.5, 'brand-coloured text/link on page'],
  ['--focus-ring', '--surface', 3.0, 'focus ring on page'],
  ['--line-strong', '--surface', 3.0, 'interactive boundary on page'],
];

let failures = 0;
for (const [themeName, themeVars] of [
  ['light', lightVars],
  ['dark', darkVars],
] as const) {
  console.log(`\n  ${themeName}`);
  for (const [fg, bg, minimum, label] of CHECKS) {
    const ratio = contrastRatio(resolveColor(fg, themeVars), resolveColor(bg, themeVars));
    const passed = ratio >= minimum;
    if (!passed) failures++;
    console.log(
      `    ${passed ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2)}:1  (min ${minimum.toFixed(1)})  ${label}`,
    );
  }
}

if (failures > 0) {
  console.error(`\ncontrast: ${failures} pairing(s) below the WCAG AA floor.`);
  process.exit(1);
}
console.log('\ncontrast: all pairings pass WCAG AA.');
