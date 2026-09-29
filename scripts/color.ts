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

/** OKLCH lightness 0..1, chroma, and hue in degrees. */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

const LINEAR_ROUNDING_TOLERANCE = 0.0005;

/** Linear (not gamma-encoded) sRGB channels of an OKLCH triple, unclamped. */
function oklchToLinear(l: number, c: number, hDeg: number): readonly [number, number, number] {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const bb = c * Math.sin(h);

  const lms = [
    (l + 0.3963377774 * a + 0.2158037573 * bb) ** 3,
    (l - 0.1055613458 * a - 0.0638541728 * bb) ** 3,
    (l - 0.0894841775 * a - 1.291485548 * bb) ** 3,
  ] as const;
  return [
    4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
    -1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
    -0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2],
  ];
}

/** True when the OKLCH colour can be shown in sRGB without clipping a channel. */
export function inSrgbGamut(l: number, c: number, h: number): boolean {
  return oklchToLinear(l, c, h).every(
    (v) => v >= -LINEAR_ROUNDING_TOLERANCE && v <= 1 + LINEAR_ROUNDING_TOLERANCE,
  );
}

/** Converts an OKLCH triple to gamma-encoded sRGB, clamping out-of-gamut channels. */
export function oklchToRgb(l: number, c: number, hDeg: number): Rgb {
  const [red, green, blue] = oklchToLinear(l, c, hDeg);
  const toGamma = (v: number): number => {
    const clamped = Math.min(1, Math.max(0, v));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  };

  return { r: toGamma(red), g: toGamma(green), b: toGamma(blue) };
}

/** The OKLCH coordinates of a `#rrggbb` colour. */
export function hexToOklch(hex: string): Oklch {
  const int = Number.parseInt(hex.replace('#', ''), HEX_RADIX);
  const toLinear = (channel: number): number => {
    const v = channel / CHANNEL_MAX;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const r = toLinear((int >> 16) & CHANNEL_MAX);
  const g = toLinear((int >> 8) & CHANNEL_MAX);
  const b = toLinear(int & CHANNEL_MAX);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const hue = (Math.atan2(okB, okA) * 180) / Math.PI;
  return { l: okL, c: Math.sqrt(okA * okA + okB * okB), h: hue < 0 ? hue + 360 : hue };
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

/** The `#rrggbb` of a `--color-<name>` token in the given tokens.css source. */
export function tokenHex(tokensCss: string, name: string): string {
  const pattern = new RegExp('--color-' + name + ': *([^;]+);');
  const match = pattern.exec(tokensCss);
  const rgb = match?.[1] === undefined ? null : parseOklch(match[1]);
  if (rgb === null) throw new Error('token --color-' + name + ' not found or not oklch()');
  return rgbToHex(rgb);
}
