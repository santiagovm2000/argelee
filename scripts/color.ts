/**
 * Colour maths shared by the scripts that read the design tokens. The tokens
 * are written in OKLCH; anything that has to paint them (a contrast check, a
 * favicon) converts here so every script agrees on the same sRGB.
 */

/** Channels in 0..1 sRGB. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const OKLCH_PATTERN = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/;
const HEX_RADIX = 16;
const HEX_WIDTH = 2;
const CHANNEL_MAX = 255;

/** Converts an OKLCH triple to gamma-encoded sRGB, clamping out-of-gamut channels. */
export function oklchToRgb(l: number, c: number, hDeg: number): Rgb {
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

/** Parses an `oklch(l c h)` string; null when the value is written any other way. */
export function parseOklch(value: string): Rgb | null {
  const match = OKLCH_PATTERN.exec(value);
  if (match === null) return null;
  return oklchToRgb(Number(match[1]), Number(match[2]), Number(match[3]));
}

/** `#rrggbb` for a 0..1 sRGB colour. */
export function rgbToHex({ r, g, b }: Rgb): string {
  const channel = (v: number): string =>
    Math.round(v * CHANNEL_MAX)
      .toString(HEX_RADIX)
      .padStart(HEX_WIDTH, '0');
  return '#' + channel(r) + channel(g) + channel(b);
}
