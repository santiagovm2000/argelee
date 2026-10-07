import {
  HALF,
  LIGHT_INK_MAX_LUMINANCE,
  LUMINANCE_WEIGHTS,
  MIN_SEPARATION,
  OKLAB_AXES,
  OKLAB_CONES,
  ZOOM,
} from './post.constants';
import type { InkTone, PhotoFraming, Rect, Size } from './post.model';

const HEX_COLOUR = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const HEX_RADIX = 16;
const CHANNEL_MAX = 255;
const LINEAR_THRESHOLD = 0.04045;
const LINEAR_DIVISOR = 12.92;
const GAMMA_OFFSET = 0.055;
const GAMMA_SCALE = 1.055;
const GAMMA = 2.4;

const COUNTRY_CODE = '58';
const TRUNK_PREFIX = '0';
const AREA_DIGITS = 3;

const DIACRITICS = /[̀-ͯ]/g;
const NOT_SLUG = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

/** The red, green and blue of a #rrggbb colour as linear light, each from 0 to 1. */
function linearChannels(hex: string): readonly number[] {
  const channels = HEX_COLOUR.exec(hex)?.slice(1) ?? ['0', '0', '0'];
  return channels.map((channel) => {
    const value = parseInt(channel, HEX_RADIX) / CHANNEL_MAX;
    return value <= LINEAR_THRESHOLD
      ? value / LINEAR_DIVISOR
      : ((value + GAMMA_OFFSET) / GAMMA_SCALE) ** GAMMA;
  });
}

/** The sum of two lists multiplied term by term. */
function weighted(weights: readonly number[], values: readonly number[]): number {
  return weights.reduce((sum, weight, index) => sum + weight * (values[index] ?? 0), 0);
}

/** The relative luminance WCAG gives a #rrggbb colour, from 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  return weighted(LUMINANCE_WEIGHTS, linearChannels(hex));
}

/** A #rrggbb colour's lightness and two colour axes in OKLab, where distance follows the eye. */
function oklab(hex: string): readonly number[] {
  const light = linearChannels(hex);
  const cones = OKLAB_CONES.map((row) => Math.cbrt(weighted(row, light)));
  return OKLAB_AXES.map((row) => weighted(row, cones));
}

/** How different two #rrggbb colours look: their distance in OKLab, 0 for the same colour. */
export function colourDistance(first: string, second: string): number {
  const other = oklab(second);
  return Math.hypot(...oklab(first).map((value, index) => value - (other[index] ?? 0)));
}

/** Whether something of this colour would be lost on a backdrop of nearly the same colour. */
export function blendsInto(colour: string, backdrop: string): boolean {
  return colourDistance(colour, backdrop) < MIN_SEPARATION;
}

/** The ink that reads on a backdrop: white on a deep colour, navy on a light one. */
export function inkToneOn(backdrop: string): InkTone {
  return luminance(backdrop) < LIGHT_INK_MAX_LUMINANCE ? 'light' : 'dark';
}

/** Breaks a text into lines no wider than the measure allows; a word alone is never split. */
export function wrapLines(
  text: string,
  maxWidth: number,
  measure: (line: string) => number,
): readonly string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter((part) => part !== '')) {
    const candidate = line === '' ? word : `${line} ${word}`;
    if (line !== '' && measure(candidate) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  return line === '' ? lines : [...lines, line];
}

/** The largest size, up to a cap, at which a text that is `widthAtCap` wide at the cap fits. */
export function fittingSize(widthAtCap: number, cap: number, maxWidth: number): number {
  return widthAtCap <= maxWidth ? cap : Math.floor((cap * maxWidth) / widthAtCap);
}

/** The number as it is dialled in the country: 584241860627 becomes 0424-1860627. */
export function localPhone(international: string): string {
  if (!international.startsWith(COUNTRY_CODE)) return international;
  const national = international.slice(COUNTRY_CODE.length);
  return `${TRUNK_PREFIX}${national.slice(0, AREA_DIGITS)}-${national.slice(AREA_DIGITS)}`;
}

/** A piece's name as a file name: lower case, accent-free, words joined by hyphens. */
export function fileSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(NOT_SLUG, '-')
    .replace(EDGE_HYPHENS, '');
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** A framing kept inside its limits. */
export function clampFraming(framing: PhotoFraming): PhotoFraming {
  return {
    zoom: clamp(framing.zoom, ZOOM.min, ZOOM.max),
    x: clamp(framing.x, -1, 1),
    y: clamp(framing.y, -1, 1),
  };
}

/**
 * Where a photo is drawn, relative to its circle's box. At a zoom of 1 its short
 * side just covers the circle; a side with room to spare follows the nudge, and
 * one that falls short of the circle stays centred in it.
 */
export function photoPlacement(photo: Size, diameter: number, framing: PhotoFraming): Rect {
  const scale = (diameter / Math.min(photo.width, photo.height)) * framing.zoom;
  const width = photo.width * scale;
  const height = photo.height * scale;
  const roomX = width - diameter;
  const roomY = height - diameter;
  return {
    x: -roomX * HALF * (roomX > 0 ? 1 - framing.x : 1),
    y: -roomY * HALF * (roomY > 0 ? 1 - framing.y : 1),
    width,
    height,
  };
}

/** The framing after the photo is dragged by a distance measured in the circle's own pixels. */
export function nudgedFraming(
  framing: PhotoFraming,
  photo: Size,
  diameter: number,
  dx: number,
  dy: number,
): PhotoFraming {
  const { width, height } = photoPlacement(photo, diameter, framing);
  const roomX = width - diameter;
  const roomY = height - diameter;
  return clampFraming({
    zoom: framing.zoom,
    x: roomX > 0 ? framing.x + dx / (roomX * HALF) : 0,
    y: roomY > 0 ? framing.y + dy / (roomY * HALF) : 0,
  });
}
