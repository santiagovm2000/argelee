import type { SupportedLanguage } from '../../i18n/i18n.constants';
import { PRICE_FRACTION_DIGITS, PRICE_LOCALES } from '../catalog.constants';
import type { Product, ProductText } from '../catalog.model';
import { localizedText } from '../localized-text';
import { ORDER_CONDITION_GROUPS, type OrderConditionGroupId } from '../order-conditions.data';
import type { PublicCatalog } from '../projection';
import {
  PDF_LARGE_PIECE_FROM,
  PDF_PIECES_PER_ROW,
  type PdfFontRole,
  PHONE_AREA_LENGTH,
  PHONE_COUNTRY_CODE,
  PHONE_GROUP_LENGTH,
  PHONE_TRUNK_PREFIX,
} from './catalog-pdf.constants';
import { CATALOG_PDF_STYLES } from './catalog-pdf.styles';

// The printed price list, built from the published catalogue: a cover, the
// pieces in bands that the browser breaks into as many pages as they need,
// and the order conditions. Everything is a string, so the same function
// serves the Worker and the local preview.

/** The locale entries the price list reads, structurally, so any locale file with them will do. */
export interface PdfLocale {
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

function priceMarkup(piece: PdfPiece, locale: PdfLocale, language: SupportedLanguage): string {
  const amount = `<span class="amount"><small>$</small>${priceDigits(piece.product.price, language)}</span>`;
  return `<span class="price"><span class="from">${escape(locale.catalog.customizer.from)}</span>${amount}</span>`;
}

function pieceMarkup(piece: PdfPiece, band: PdfBand, input: PdfInput): string {
  const { locale, language, assets } = input;
  const photo = `<div class="photo"><img src="${escape(assets.photoUrl(piece.product.photo.key))}" alt=""></div>`;
  const description = `<p class="desc">${escape(piece.text.description)}</p>`;
  if (piece.wide) {
    return `<article class="piece piece--wide">
        ${photo}
        <div class="piece-text">
          <h3>${escape(piece.text.name)}</h3>
          <div class="price-block">${priceMarkup(piece, locale, language)}<span class="price-unit">${escape(locale.pdf.perUnit)}</span></div>
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
        <div class="piece-head"><h3>${escape(piece.text.name)}</h3>${priceMarkup(piece, locale, language)}</div>
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
      <div class="group-head"><h2>${escape(band.title)}</h2>${volume}</div>
      ${body}
    </div>`;
}

/** The pieces as a table: the browser repeats its head (wordmark, top margin) and its foot (bottom margin) on every page. */
function sheetMarkup(bands: readonly PdfBand[], input: PdfInput): string {
  return `<table class="sheet">
    <thead><tr><td><div class="wordmark">${escape(input.brand)}</div></td></tr></thead>
    <tfoot><tr><td></td></tr></tfoot>
    <tbody><tr><td>
    ${bands.map((band) => bandMarkup(band, input)).join('\n')}
    </td></tr></tbody>
  </table>`;
}

function coverMarkup(input: PdfInput): string {
  const { locale, brand, assets, catalog } = input;
  const first = catalog.products[0];
  const frame =
    first === undefined
      ? ''
      : `<div class="cover-frame"><div class="cover-photo"><img src="${escape(assets.coverPhotoUrl(first.photo.key))}" alt=""></div></div>`;
  return `<section class="cover">
    <svg class="cover-bg" viewBox="0 0 210 297" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="sweep" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#3B5876"/><stop offset="1" stop-color="#4E6E90"/></linearGradient></defs>
      <circle cx="222" cy="12" r="82" fill="#EAF1F8"/>
      <path d="M0,206 C70,196 125,162 210,140 L210,297 L0,297 Z" fill="#B9CFE7"/>
      <path d="M0,214 C70,204 125,171 210,148 L210,297 L0,297 Z" fill="url(#sweep)"/>
    </svg>
    <header class="cover-brand"><div class="wordmark">${escape(brand)}</div><div class="cover-sub">${escape(locale.pdf.cover.sub)}</div></header>
    ${frame}
    <h1 class="cover-title">${escape(locale.pdf.cover.title)}</h1>
    <p class="cover-lead">${escape(locale.pdf.cover.lead)}</p>
    <span class="cover-tag">${escape(locale.pdf.cover.tag)}</span>
  </section>`;
}

function conditionsMarkup(input: PdfInput): string {
  const { locale, brand, assets, whatsappNumber } = input;
  const groups = ORDER_CONDITION_GROUPS.map((group) => {
    const notes = group.noteKeys
      .map((key) => key.split('.').at(-1) ?? '')
      .map((note) => `<li>${escape(locale.landing.orders.notes[note] ?? '')}</li>`)
      .join('');
    return `<section class="condition-group">
        <h3 class="condition-title"><svg class="condition-icon" viewBox="0 0 24 24" aria-hidden="true">${assets.iconMarkup(group.id)}</svg><span>${escape(locale.landing.orders.groups[group.id])}</span></h3>
        <ul class="condition-list">${notes}</ul>
      </section>`;
  }).join('\n');
  return `<section class="page-conditions">
    <header class="brand"><div class="wordmark">${escape(brand)}</div></header>
    <div class="group">
      <div class="group-head"><h2>${escape(locale.landing.orders.title)}</h2></div>
      <div class="conditions">${groups}</div>
    </div>
    <div class="order-wrap"><div class="order">
      <div class="order-head"><h2>${escape(locale.pdf.order.title)}</h2><div class="number">${escape(displayPhone(whatsappNumber))}</div></div>
      <p>${escape(locale.pdf.order.lead)}</p>
    </div></div>
  </section>`;
}

/** The whole price list as one HTML document, ready for a headless browser to print to A4. */
export function renderCatalogHtml(input: PdfInput): string {
  const { locale, language, assets, brand } = input;
  const bands = catalogBands(input.catalog, locale, language);
  const fonts = `@font-face{font-family:'Italiana';font-weight:400;src:url('${escape(assets.fontUrl('display'))}') format('woff2')}
@font-face{font-family:'Karla';font-weight:300 600;src:url('${escape(assets.fontUrl('body'))}') format('woff2')}
@font-face{font-family:'Parisienne';font-weight:400;src:url('${escape(assets.fontUrl('script'))}') format('woff2')}`;
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
${coverMarkup(input)}
${sheetMarkup(bands, input)}
${conditionsMarkup(input)}
</body>
</html>
`;
}
