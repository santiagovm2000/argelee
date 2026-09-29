import type { SupportedLanguage } from '../../i18n/i18n.constants';
import { PRICE_FRACTION_DIGITS, PRICE_LOCALES } from '../catalog.constants';
import type { Product, ProductText } from '../catalog.model';
import { localizedText } from '../localized-text';
import { ORDER_CONDITION_GROUPS, type OrderConditionGroupId } from '../order-conditions.data';
import type { PublicCatalog } from '../projection';
import {
  PDF_LARGE_PIECE_FROM,
  PDF_PIECES_PER_ROW,
  type PdfArt,
  type PdfFontRole,
  PHONE_AREA_LENGTH,
  PHONE_COUNTRY_CODE,
  PHONE_GROUP_LENGTH,
  PHONE_TRUNK_PREFIX,
} from './catalog-pdf.constants';
import { CATALOG_PDF_STYLES } from './catalog-pdf.styles';

// The printed price list, built from the published catalogue in the brand's
// own dress: a cover like its business card, the pieces in bands that the
// browser breaks into as many pages as they need, and the order conditions.
// Everything is a string, so the same function serves the Worker and the
// local preview.

/** The locale entries the price list reads, structurally, so any locale file with them will do. */
export interface PdfLocale {
  readonly brand: {
    readonly tagline: string;
    readonly seal: { readonly top: string; readonly bottom: string };
  };
  readonly catalog: { readonly customizer: { readonly from: string; readonly serves: string } };
  readonly landing: {
    readonly orders: {
      readonly title: string;
      readonly groups: Readonly<Record<OrderConditionGroupId, string>>;
      readonly notes: Readonly<Record<string, string>>;
    };
  };
  readonly pdf: {
    readonly cover: {
      readonly sub: string;
      readonly title: string;
      readonly lead: string;
      readonly tag: string;
    };
    readonly band: { readonly serves: string; readonly unit: string; readonly unitVolume: string };
    readonly perUnit: string;
    readonly order: { readonly title: string; readonly lead: string };
  };
}

export interface PdfAssets {
  readonly fontUrl: (role: PdfFontRole) => string;
  readonly photoUrl: (key: string) => string;
  readonly coverPhotoUrl: (key: string) => string;
  /** The drawing inside the group's glyph file, without its outer <svg>. */
  readonly iconMarkup: (group: OrderConditionGroupId) => string;
  /** One of the brand's drawings, as its whole SVG file. */
  readonly artSvg: (art: PdfArt) => string;
}

export interface PdfInput {
  readonly catalog: PublicCatalog;
  readonly locale: PdfLocale;
  readonly language: SupportedLanguage;
  readonly brand: string;
  readonly whatsappNumber: string;
  readonly assets: PdfAssets;
}

export interface PdfPiece {
  readonly product: Product;
  readonly text: ProductText;
  /** A piece sold by the unit takes a full-width card. */
  readonly wide: boolean;
}

export interface PdfBand {
  readonly title: string;
  readonly volume: string | null;
  /** True when the band mixes sizes, so each piece states its own. */
  readonly showSize: boolean;
  readonly pieces: readonly PdfPiece[];
}

const ART_PREFIX = 'art-';
const CAUSTIC_LAYERS = ['light', 'glint'] as const;
const DAISY_COUNT = { cover: 7, order: 3 } as const;
const WATER_FIT = ' preserveAspectRatio="xMidYMid slice"';

function interpolate(template: string, params: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** "0424 186 0627" from the wa.me digits, the way the number is read aloud locally. */
export function displayPhone(number: string): string {
  const local = number.startsWith(PHONE_COUNTRY_CODE)
    ? number.slice(PHONE_COUNTRY_CODE.length)
    : number;
  const area = local.slice(0, PHONE_AREA_LENGTH);
  const rest = local.slice(PHONE_AREA_LENGTH);
  const groups = [rest.slice(0, PHONE_GROUP_LENGTH), rest.slice(PHONE_GROUP_LENGTH)].filter(
    (group) => group !== '',
  );
  return `${PHONE_TRUNK_PREFIX}${area} ${groups.join(' ')}`;
}

/** The number part of a price in the catalogue's locale: "60", "3,50". */
function priceDigits(amount: number, language: SupportedLanguage): string {
  const digits = Number.isInteger(amount) ? 0 : PRICE_FRACTION_DIGITS;
  return new Intl.NumberFormat(PRICE_LOCALES[language], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

function rowsOf<Item>(items: readonly Item[], size: number): Item[][] {
  const rows: Item[][] = [];
  for (let start = 0; start < items.length; start += size) {
    rows.push(items.slice(start, start + size));
  }
  return rows;
}

/** Groups the shelf into bands: the large pieces, the medium ones, then those sold by the unit. */
export function catalogBands(
  catalog: PublicCatalog,
  locale: PdfLocale,
  language: SupportedLanguage,
): PdfBand[] {
  const pieces: PdfPiece[] = catalog.products.map((product) => ({
    product,
    text: localizedText(product.text, language),
    wide: product.serves === null,
  }));
  const whole = pieces
    .filter((piece) => piece.product.serves !== null)
    .sort((a, b) => (b.product.serves?.[0] ?? 0) - (a.product.serves?.[0] ?? 0));
  const large = whole.filter((piece) => (piece.product.serves?.[0] ?? 0) >= PDF_LARGE_PIECE_FROM);
  const medium = whole.filter((piece) => (piece.product.serves?.[0] ?? 0) < PDF_LARGE_PIECE_FROM);
  const units = pieces.filter((piece) => piece.wide);

  const sizedBand = (group: readonly PdfPiece[]): PdfBand | null => {
    if (group.length === 0) return null;
    const ranges = group.map((piece) => piece.product.serves ?? [0, 0]);
    const from = Math.min(...ranges.map((range) => range[0]));
    const to = Math.max(...ranges.map((range) => range[1]));
    return {
      title: interpolate(locale.pdf.band.serves, { from, to }),
      volume: null,
      showSize: new Set(ranges.map((range) => range.join('-'))).size > 1,
      pieces: group,
    };
  };
  const bands: PdfBand[] = [sizedBand(large), sizedBand(medium)].filter(
    (band): band is PdfBand => band !== null,
  );
  if (units.length > 0) {
    bands.push({
      title: locale.pdf.band.unit,
      volume: locale.pdf.band.unitVolume,
      showSize: false,
      pieces: units,
    });
  }
  return bands;
}

/** The view box and the drawing inside an SVG file, or null when the file is not an SVG. */
function svgParts(svg: string): { viewBox: string; inner: string } | null {
  const match = /<svg([^>]*)>([\s\S]*)<\/svg>/.exec(svg);
  const viewBox = /viewBox="([^"]+)"/.exec(match?.[1] ?? '')?.[1];
  const inner = match?.[2];
  return viewBox === undefined || inner === undefined ? null : { viewBox, inner: inner.trim() };
}

/** The brand drawings as symbols in one hidden sprite, so each is embedded once and drawn anywhere. */
function artSprite(assets: PdfAssets): string {
  const symbol = (id: string, viewBox: string, inner: string, fit = ''): string =>
    `<symbol id="${ART_PREFIX}${id}" viewBox="${viewBox}"${fit}>${inner}</symbol>`;
  const symbols: string[] = [];
  for (const art of ['logo', 'monogram', 'daisy'] as const) {
    const parts = svgParts(assets.artSvg(art));
    if (parts !== null) symbols.push(symbol(art, parts.viewBox, parts.inner));
  }
  const caustics = svgParts(assets.artSvg('caustics'));
  if (caustics !== null) {
    for (const layer of CAUSTIC_LAYERS) {
      const path = new RegExp(`<path[^>]*id="${layer}"[^>]*/>`).exec(caustics.inner)?.[0];
      if (path !== undefined) {
        const drawing = path.replace(/\sid="[^"]*"/, '');
        symbols.push(symbol(`caustics-${layer}`, caustics.viewBox, drawing, WATER_FIT));
      }
    }
  }
  return `<svg class="sprite" aria-hidden="true"><defs>${symbols.join('')}</defs></svg>`;
}

/** Draws a sprite symbol at the size its class gives it. */
function art(id: string, className: string): string {
  return `<svg class="${className}" aria-hidden="true"><use href="#${ART_PREFIX}${id}"/></svg>`;
}

/** The brand's water behind a block: its lighter shapes and its bright channels. */
function waterMarkup(): string {
  return `<div class="water">${CAUSTIC_LAYERS.map((layer) => art(`caustics-${layer}`, `water-${layer}`)).join('')}</div>`;
}

function daisies(count: number, className: string): string {
  return `<div class="${className}">${Array.from({ length: count }, () => art('daisy', 'daisy')).join('')}</div>`;
}

/** The round label the brand seals its cups with, words set around its edge. */
function sealMarkup(locale: PdfLocale): string {
  return `<svg class="seal" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="100" class="seal-disc"/>
      <path id="seal-top" d="M 33 100 A 67 67 0 0 1 167 100" fill="none"/>
      <path id="seal-bottom" d="M 22 100 A 78 78 0 0 0 178 100" fill="none"/>
      <text class="seal-text" text-anchor="middle"><textPath href="#seal-top" startOffset="50%">${escape(locale.brand.seal.top)}</textPath></text>
      <text class="seal-text" text-anchor="middle"><textPath href="#seal-bottom" startOffset="50%">${escape(locale.brand.seal.bottom)}</textPath></text>
      <svg x="60" y="70" width="80" height="62" class="seal-mark"><use href="#${ART_PREFIX}monogram"/></svg>
    </svg>`;
}

/** The price as one of the brand's round labels. */
function stickerMarkup(piece: PdfPiece, locale: PdfLocale, language: SupportedLanguage): string {
  const unit = piece.wide ? `<span class="each">${escape(locale.pdf.perUnit)}</span>` : '';
  return `<span class="sticker"><span class="from">${escape(locale.catalog.customizer.from)}</span><span class="amount"><small>$</small>${priceDigits(piece.product.price, language)}</span>${unit}</span>`;
}

function pieceMarkup(piece: PdfPiece, band: PdfBand, input: PdfInput): string {
  const { locale, language, assets } = input;
  const photo = `<div class="photo-wrap"><div class="photo"><img src="${escape(assets.photoUrl(piece.product.photo.key))}" alt=""></div>${stickerMarkup(piece, locale, language)}</div>`;
  const description = `<p class="desc">${escape(piece.text.description)}</p>`;
  if (piece.wide) {
    return `<article class="piece piece--wide">
        ${photo}
        <div class="piece-text">
          <h3>${escape(piece.text.name)}</h3>
          ${description}
        </div>
      </article>`;
  }
  const serves = piece.product.serves;
  const size =
    band.showSize && serves !== null
      ? `<p class="size">${escape(interpolate(locale.catalog.customizer.serves, { from: serves[0], to: serves[1] }))}</p>`
      : '';
  return `<article class="piece">
        ${photo}
        <h3>${escape(piece.text.name)}</h3>
        ${size}
        ${description}
      </article>`;
}

function bandMarkup(band: PdfBand, input: PdfInput): string {
  const volume = band.volume === null ? '' : `<span class="volume">${escape(band.volume)}</span>`;
  const cards = (pieces: readonly PdfPiece[]): string =>
    pieces.map((piece) => pieceMarkup(piece, band, input)).join('\n');
  const body = band.pieces.some((piece) => piece.wide)
    ? cards(band.pieces)
    : rowsOf(band.pieces, PDF_PIECES_PER_ROW)
        .map((row) => `<div class="row">${cards(row)}</div>`)
        .join('\n');
  return `<div class="group">
      <div class="group-head">${art('daisy', 'group-daisy')}<h2>${escape(band.title)}</h2>${volume}</div>
      ${body}
    </div>`;
}

/**
 * The slim brand line at the top of every inner page: the logo and how to order.
 * The logo is drawn in place rather than from the sprite, because Chrome does
 * not repaint a <use> inside a table head it repeats on the following pages.
 */
function pageHeadMarkup(input: PdfInput): string {
  const { locale, assets, whatsappNumber } = input;
  const logo = svgParts(assets.artSvg('logo'));
  const mark =
    logo === null
      ? ''
      : `<svg class="page-logo" viewBox="${logo.viewBox}" aria-hidden="true">${logo.inner}</svg>`;
  return `<div class="page-head">${mark}<span class="page-order">${escape(locale.pdf.order.title)}<strong>${escape(displayPhone(whatsappNumber))}</strong></span></div>`;
}

/** The pieces as a table: the browser repeats its head (the brand line) and its foot (the bottom margin) on every page. */
function sheetMarkup(bands: readonly PdfBand[], input: PdfInput): string {
  return `<table class="sheet">
    <thead><tr><td>${pageHeadMarkup(input)}</td></tr></thead>
    <tfoot><tr><td></td></tr></tfoot>
    <tbody><tr><td>
    ${bands.map((band) => bandMarkup(band, input)).join('\n')}
    </td></tr></tbody>
  </table>`;
}

function coverMarkup(input: PdfInput): string {
  const { locale, assets, catalog } = input;
  const first = catalog.products[0];
  const lid =
    first === undefined
      ? ''
      : `<div class="cover-lid"><div class="lid"><img src="${escape(assets.coverPhotoUrl(first.photo.key))}" alt=""></div>${sealMarkup(locale)}</div>`;
  return `<section class="cover">
    ${waterMarkup()}
    ${daisies(DAISY_COUNT.cover, 'cover-daisies')}
    <header class="cover-brand">${art('logo', 'cover-logo')}<p class="cover-tagline">${escape(locale.brand.tagline)}</p></header>
    ${lid}
    <footer class="cover-foot">
      <div><h1 class="cover-title">${escape(locale.pdf.cover.title)}</h1><p class="cover-sub">${escape(locale.pdf.cover.sub)}</p></div>
      <span class="cover-tag">${escape(locale.pdf.cover.tag)}</span>
    </footer>
  </section>`;
}

function conditionsMarkup(input: PdfInput): string {
  const { locale, assets, whatsappNumber } = input;
  const groups = ORDER_CONDITION_GROUPS.map((group) => {
    const notes = group.noteKeys
      .map((key) => key.split('.').at(-1) ?? '')
      .map((note) => `<li>${escape(locale.landing.orders.notes[note] ?? '')}</li>`)
      .join('');
    return `<section class="condition-group">
        <h3 class="condition-title"><span class="condition-badge"><svg class="condition-icon" viewBox="0 0 24 24" aria-hidden="true">${assets.iconMarkup(group.id)}</svg></span><span>${escape(locale.landing.orders.groups[group.id])}</span></h3>
        <ul class="condition-list">${notes}</ul>
      </section>`;
  }).join('\n');
  return `<section class="page-conditions">
    ${pageHeadMarkup(input)}
    <h2 class="conditions-title">${escape(locale.landing.orders.title)}</h2>
    <div class="conditions">${groups}</div>
    <div class="order">
      ${waterMarkup()}
      ${daisies(DAISY_COUNT.order, 'order-daisies')}
      ${art('monogram', 'order-mark')}
      <div class="order-text">
        <h2>${escape(locale.pdf.order.title)}</h2>
        <div class="number">${escape(displayPhone(whatsappNumber))}</div>
        <p>${escape(locale.pdf.order.lead)}</p>
      </div>
    </div>
  </section>`;
}

/** The whole price list as one HTML document, ready for a headless browser to print to A4. */
export function renderCatalogHtml(input: PdfInput): string {
  const { locale, language, assets, brand } = input;
  const bands = catalogBands(input.catalog, locale, language);
  const fonts = `@font-face{font-family:'Lato';font-weight:400;src:url('${escape(assets.fontUrl('regular'))}') format('woff2')}
@font-face{font-family:'Lato';font-weight:700;src:url('${escape(assets.fontUrl('bold'))}') format('woff2')}
@font-face{font-family:'Lato';font-weight:900;src:url('${escape(assets.fontUrl('black'))}') format('woff2')}
@font-face{font-family:'Great Vibes';font-weight:400;src:url('${escape(assets.fontUrl('script'))}') format('woff2')}`;
  return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8">
<title>${escape(brand)}, ${escape(locale.pdf.cover.title)}</title>
<style>
${fonts}
${CATALOG_PDF_STYLES}
</style>
</head>
<body>
${artSprite(assets)}
${coverMarkup(input)}
${sheetMarkup(bands, input)}
${conditionsMarkup(input)}
</body>
</html>
`;
}
