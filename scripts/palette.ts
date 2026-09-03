/**
 * Derives the full tonal palette from a single brand hex and prints the
 * `@theme` block for src/styles/tokens.css.
 *
 * Run with `bun run palette` after changing BRAND_HEX. The point is that the
 * brand colour lives in exactly ONE place: change it here, regenerate, paste.
 *
 * Scales are built in OKLCH so every step is perceptually even — the reason
 * `brand-400` on dark and `brand-600` on light read as the same "weight".
 */
const BRAND_HEX = '#3AC5F7';

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

/** Lightness targets per step, and how much of the base chroma each step keeps. */
const STEPS: readonly (readonly [name: number, lightness: number, chromaRatio: number])[] = [
  [50, 0.975, 0.12],
  [100, 0.945, 0.24],
  [200, 0.895, 0.45],
  [300, 0.835, 0.68],
  [400, 0.775, 0.9],
  [500, 0.71, 1.0],
  [600, 0.63, 0.98],
  [700, 0.53, 0.88],
  [800, 0.43, 0.74],
  [900, 0.34, 0.58],
  [950, 0.24, 0.42],
];

const base = hexToOklch(BRAND_HEX);
const hue = round(base.h, 1);

console.log(
  `/* Brand scale derived from ${BRAND_HEX} (oklch L ${round(base.l, 3)} C ${round(base.c, 3)} H ${hue}) */`,
);
for (const [name, lightness, chromaRatio] of STEPS) {
  console.log(
    `  --color-brand-${name}: oklch(${lightness} ${round(base.c * chromaRatio, 3)} ${hue});`,
  );
}

/* A neutral carrying a trace of the brand hue reads as intentional rather than
   as the framework's default grey. Chroma stays under 0.012 so it never tints. */
console.log(`\n/* Neutrals, hue-matched to the brand at very low chroma */`);
const NEUTRALS: readonly (readonly [name: number, lightness: number, chroma: number])[] = [
  [0, 1, 0],
  [50, 0.985, 0.003],
  [100, 0.962, 0.005],
  [200, 0.922, 0.007],
  [300, 0.868, 0.009],
  [400, 0.715, 0.011],
  [500, 0.575, 0.012],
  [600, 0.46, 0.012],
  [700, 0.37, 0.011],
  [800, 0.272, 0.01],
  [900, 0.19, 0.008],
  [950, 0.128, 0.006],
];
for (const [name, lightness, chroma] of NEUTRALS) {
  console.log(`  --color-neutral-${name}: oklch(${lightness} ${chroma} ${hue});`);
}
