/**
 * Derives the full tonal palette from a single brand hex and prints the
 * `@theme` block for src/styles/tokens.css.
 *
 * Run with `bun run palette` after changing BRAND_HEX. The point is that the
 * brand colour lives in exactly ONE place: change it here, regenerate, paste.
 *
 * Scales are built in OKLCH so every step is perceptually even — the reason
 * `brand-200` on dark and `brand-600` on light read as the same "weight".
 */
const BRAND_HEX = '#4E6E90';

interface Oklch {
  l: number;
  c: number;
  h: number;
}

function hexToOklch(hex: string): Oklch {
  const int = Number.parseInt(hex.replace('#', ''), 16);
  const toLinear = (channel: number): number => {
    const v = channel / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const r = toLinear((int >> 16) & 255);
  const g = toLinear((int >> 8) & 255);
  const b = toLinear(int & 255);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const hue = (Math.atan2(okB, okA) * 180) / Math.PI;
  return {
    l: okL,
    c: Math.sqrt(okA * okA + okB * okB),
    h: hue < 0 ? hue + 360 : hue,
  };
}

const round = (value: number, places: number): number => Number(value.toFixed(places));

/** Step 600 is anchored to BRAND_HEX itself (a mid-tone brand); the rest ramp around it. */
const STEPS: readonly (readonly [name: number, lightness: number | null, chromaRatio: number])[] = [
  [50, 0.978, 0.08],
  [100, 0.955, 0.18],
  [200, 0.847, 0.62],
  [300, 0.78, 0.8],
  [400, 0.702, 1.0],
  [500, 0.61, 1.08],
  [600, null, 1.0],
  [700, 0.45, 0.92],
  [800, 0.37, 0.77],
  [900, 0.29, 0.6],
  [950, 0.248, 0.38],
];

const base = hexToOklch(BRAND_HEX);
const hue = round(base.h, 1);

console.log(
  `/* Brand scale derived from ${BRAND_HEX} (oklch L ${round(base.l, 3)} C ${round(base.c, 3)} H ${hue}) */`,
);
for (const [name, lightness, chromaRatio] of STEPS) {
  const l = lightness ?? round(base.l, 3);
  const anchor = lightness === null ? ' /* BRAND_HEX exactly */' : '';
  console.log(
    `  --color-brand-${name}: oklch(${l} ${round(base.c * chromaRatio, 3)} ${hue});${anchor}`,
  );
}

/* The neutrals carry a visible trace of the brand hue: a cool, inky grey rather
   than a framework default. Chroma peaks in the mid-tones and fades to white. */
console.log(`\n/* Neutrals, hue-matched to the brand */`);
const NEUTRALS: readonly (readonly [name: number, lightness: number, chroma: number])[] = [
  [0, 1, 0],
  [50, 0.985, 0.004],
  [100, 0.958, 0.01],
  [200, 0.932, 0.013],
  [300, 0.868, 0.016],
  [400, 0.728, 0.028],
  [500, 0.524, 0.033],
  [600, 0.45, 0.03],
  [700, 0.37, 0.028],
  [800, 0.296, 0.025],
  [900, 0.227, 0.021],
  [950, 0.188, 0.015],
];
for (const [name, lightness, chroma] of NEUTRALS) {
  console.log(`  --color-neutral-${name}: oklch(${lightness} ${chroma} ${hue});`);
}
