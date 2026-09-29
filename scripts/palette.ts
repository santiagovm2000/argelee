/**
 * Derives every tonal scale from the brand's five colours and prints the
 * colour part of the `@theme` block for src/styles/tokens.css.
 *
 * Run with `bun run palette` after changing a hex in BRAND. The brand colours
 * live in exactly ONE place: change them here, regenerate, paste.
 *
 * Scales are built in OKLCH so every step is perceptually even. Each brand hex
 * lands exactly on the step whose lightness it is closest to; the other steps
 * keep its hue and scale its chroma, pulled back into sRGB where a step would
 * otherwise be clipped by the screen.
 */
import { hexToOklch, inSrgbGamut } from './color';

const BRAND = {
  mango: '#FFCA00',
  coral: '#FF9000',
  crystal: '#008AFF',
  turquoise: '#00C1CA',
  mint: '#00CB7E',
} as const;

const INK_HUE_SOURCE: keyof typeof BRAND = 'crystal';

const STEPS: readonly (readonly [name: number, lightness: number, chromaRatio: number])[] = [
  [50, 0.975, 0.12],
  [100, 0.95, 0.24],
  [200, 0.9, 0.48],
  [300, 0.84, 0.72],
  [400, 0.76, 0.92],
  [500, 0.66, 1.0],
  [600, 0.55, 0.96],
  [700, 0.47, 0.86],
  [800, 0.39, 0.72],
  [900, 0.31, 0.56],
  [950, 0.24, 0.42],
];

const NEUTRALS: readonly (readonly [name: number, lightness: number, chroma: number])[] = [
  [0, 1, 0],
  [50, 0.978, 0.006],
  [100, 0.952, 0.012],
  [200, 0.912, 0.018],
  [300, 0.84, 0.026],
  [400, 0.7, 0.038],
  [500, 0.56, 0.05],
  [600, 0.47, 0.056],
  [700, 0.39, 0.058],
  [800, 0.31, 0.056],
  [900, 0.25, 0.052],
  [950, 0.2, 0.044],
];

const CHROMA_STEP = 0.001;

const round = (value: number, places: number): number => Number(value.toFixed(places));

/** The largest chroma up to `wanted` that sRGB can show at this lightness and hue. */
function fitChroma(l: number, wanted: number, h: number): number {
  let c = wanted;
  while (c > 0 && !inSrgbGamut(l, c, h)) c -= CHROMA_STEP;
  return Math.max(0, c);
}

for (const [name, hex] of Object.entries(BRAND)) {
  const base = hexToOklch(hex);
  const hue = round(base.h, 1);
  const anchor = STEPS.reduce((best, step) =>
    Math.abs(step[1] - base.l) < Math.abs(best[1] - base.l) ? step : best,
  );
  console.log(
    `\n  /* ${name}: ${hex} (oklch L ${round(base.l, 3)} C ${round(base.c, 3)} H ${hue}) */`,
  );
  for (const [step, lightness, chromaRatio] of STEPS) {
    const exact = step === anchor[0];
    const l = exact ? round(base.l, 3) : lightness;
    const c = exact ? round(base.c, 3) : round(fitChroma(l, base.c * chromaRatio, base.h), 3);
    console.log(
      `  --color-${name}-${step}: oklch(${l} ${c} ${hue});${exact ? ` /* ${hex} */` : ''}`,
    );
  }
}

const inkHue = round(hexToOklch(BRAND[INK_HUE_SOURCE]).h, 1);
console.log(`\n  /* ink: neutrals on the ${INK_HUE_SOURCE} hue */`);
for (const [name, lightness, chroma] of NEUTRALS) {
  console.log(`  --color-neutral-${name}: oklch(${lightness} ${chroma} ${inkHue});`);
}
