import type { PdfAssets } from '../../src/app/core/catalog/pdf/catalog-pdf';
import {
  PDF_COVER_PHOTO_WIDTH,
  PDF_FONT_FILES,
  PDF_FONTS_PUBLIC_PATH,
  PDF_PHOTO_QUALITY,
  PDF_PHOTO_WIDTH,
} from '../../src/app/core/catalog/pdf/catalog-pdf.constants';
import { IMAGE_TRANSFORM_PATH } from '../../src/app/core/images/image.constants';
import delivery from '../../public/icons/orders/delivery.svg';
import payment from '../../public/icons/orders/payment.svg';
import piece from '../../public/icons/orders/piece.svg';

const ICONS = { piece, payment, delivery } as const;

/** The drawing inside an SVG file, without its outer element. */
export function svgInner(svg: string): string {
  return /<svg[^>]*>([\s\S]*)<\/svg>/.exec(svg)?.[1]?.trim() ?? '';
}

/** Where the headless browser fetches fonts and photos from: the live site itself. */
export function siteAssets(origin: string, transforms: boolean): PdfAssets {
  const photo = (key: string, width: number): string =>
    transforms
      ? `${origin}/${IMAGE_TRANSFORM_PATH}/width=${String(width)},quality=${String(PDF_PHOTO_QUALITY)},format=jpeg/${key}`
      : `${origin}/${key}`;
  return {
    fontUrl: (role) => `${origin}/${PDF_FONTS_PUBLIC_PATH}${PDF_FONT_FILES[role]}`,
    photoUrl: (key) => photo(key, PDF_PHOTO_WIDTH),
    coverPhotoUrl: (key) => photo(key, PDF_COVER_PHOTO_WIDTH),
    iconMarkup: (group) => svgInner(ICONS[group]),
  };
}
