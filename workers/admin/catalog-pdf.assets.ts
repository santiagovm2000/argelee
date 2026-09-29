import type { PdfAssets } from '../../src/app/core/catalog/pdf/catalog-pdf';
import {
  PDF_COVER_PHOTO_WIDTH,
  type PdfFontRole,
  PDF_PHOTO_QUALITY,
  PDF_PHOTO_WIDTH,
} from '../../src/app/core/catalog/pdf/catalog-pdf.constants';
import { IMAGE_TRANSFORM_PATH } from '../../src/app/core/images/image.constants';
import caustics from '../../public/brand/caustics.svg';
import daisy from '../../public/brand/daisy.svg';
import logo from '../../public/brand/logo.svg';
import monogram from '../../public/brand/monogram.svg';
import delivery from '../../public/icons/orders/delivery.svg';
import payment from '../../public/icons/orders/payment.svg';
import piece from '../../public/icons/orders/piece.svg';
import greatVibes from '../../src/styles/fonts/great-vibes-latin.woff2';
import lato400 from '../../src/styles/fonts/lato-400-latin.woff2';
import lato700 from '../../src/styles/fonts/lato-700-latin.woff2';
import lato900 from '../../src/styles/fonts/lato-900-latin.woff2';

const ICONS = { piece, payment, delivery } as const;
const ART = { logo, monogram, daisy, caustics } as const;
const FONTS: Readonly<Record<PdfFontRole, ArrayBuffer>> = {
  regular: lato400,
  bold: lato700,
  black: lato900,
  script: greatVibes,
};
const WOFF2_DATA_URL = 'data:font/woff2;base64,';
const BYTES_PER_CHUNK = 0x8000;

/** The drawing inside an SVG file, without its outer element. */
export function svgInner(svg: string): string {
  return /<svg[^>]*>([\s\S]*)<\/svg>/.exec(svg)?.[1]?.trim() ?? '';
}

/** Base64 of some bytes, a chunk at a time so no call gets too many arguments. */
function base64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = '';
  for (let start = 0; start < view.length; start += BYTES_PER_CHUNK) {
    binary += String.fromCharCode(...view.subarray(start, start + BYTES_PER_CHUNK));
  }
  return btoa(binary);
}

/**
 * What the headless browser prints with. The fonts travel inside the document,
 * so the price list never depends on which fonts the live site happens to
 * serve; the photos come from the live site itself.
 */
export function siteAssets(origin: string, transforms: boolean): PdfAssets {
  const photo = (key: string, width: number): string =>
    transforms
      ? `${origin}/${IMAGE_TRANSFORM_PATH}/width=${String(width)},quality=${String(PDF_PHOTO_QUALITY)},format=jpeg/${key}`
      : `${origin}/${key}`;
  return {
    fontUrl: (role) => `${WOFF2_DATA_URL}${base64(FONTS[role])}`,
    photoUrl: (key) => photo(key, PDF_PHOTO_WIDTH),
    coverPhotoUrl: (key) => photo(key, PDF_COVER_PHOTO_WIDTH),
    iconMarkup: (group) => svgInner(ICONS[group]),
    artSvg: (art) => ART[art],
  };
}
