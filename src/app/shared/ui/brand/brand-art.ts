const BRAND_DIR = 'brand';

/**
 * One of the brand book's drawings, traced once from its artwork into a plain
 * SVG file under public/brand. A template draws it with <use href>, so the file
 * is fetched once and never inlined; the view box is the file's own, so the
 * outer <svg> keeps the drawing's proportions.
 */
export interface BrandArt {
  readonly href: string;
  readonly viewBox: string;
}

export const BRAND_ART = {
  logo: { href: `${BRAND_DIR}/logo.svg#glyph`, viewBox: '0 0 1200 420' },
  monogram: { href: `${BRAND_DIR}/monogram.svg#glyph`, viewBox: '0 0 600 464' },
  daisy: { href: `${BRAND_DIR}/daisy.svg#glyph`, viewBox: '0 0 360 387' },
  causticsLight: { href: `${BRAND_DIR}/caustics.svg#light`, viewBox: '0 0 900 1229' },
  causticsGlint: { href: `${BRAND_DIR}/caustics.svg#glint`, viewBox: '0 0 900 1229' },
} as const satisfies Record<string, BrandArt>;
