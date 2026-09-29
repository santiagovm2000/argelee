export const PDF_PIECES_PER_ROW = 2;
export const PDF_LARGE_PIECE_FROM = 16;
/** Lines a card keeps of a name and of a description; the site shows the whole text. */
export const PDF_NAME_LINES = 2;
export const PDF_DESCRIPTION_LINES = 4;

export const PDF_PHOTO_WIDTH = 1200;
export const PDF_COVER_PHOTO_WIDTH = 1400;
export const PDF_PHOTO_QUALITY = 85;

export const PDF_FONT_FILES = {
  regular: 'lato-400-latin.woff2',
  bold: 'lato-700-latin.woff2',
  black: 'lato-900-latin.woff2',
  script: 'great-vibes-latin.woff2',
} as const;
export type PdfFontRole = keyof typeof PDF_FONT_FILES;

export const PDF_ART_FILES = {
  logo: 'brand/logo.svg',
  monogram: 'brand/monogram.svg',
  daisy: 'brand/daisy.svg',
  caustics: 'brand/caustics.svg',
} as const;
export type PdfArt = keyof typeof PDF_ART_FILES;

export const PDF_PAGE_WIDTH_MM = 210;
export const PDF_PAGE_HEIGHT_MM = 297;

export const PHONE_COUNTRY_CODE = '58';
export const PHONE_TRUNK_PREFIX = '0';
export const PHONE_AREA_LENGTH = 3;
export const PHONE_GROUP_LENGTH = 3;
