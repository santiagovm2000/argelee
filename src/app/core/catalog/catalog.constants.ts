import type { SupportedLanguage } from '../i18n/i18n.constants';

// Prices are the owner's list, kept in the panel, in US dollars.
export const CURRENCY_CODE = 'USD';

export const PRICE_LOCALES: Readonly<Record<SupportedLanguage, string>> = {
  es: 'es-VE',
};

// A bare "$" reads as dollars to both audiences.
export const PRICE_DISPLAY: Readonly<Record<SupportedLanguage, 'narrowSymbol' | 'code'>> = {
  es: 'narrowSymbol',
};

// The list goes to the half dollar (the individual portion is $3.50), so
// quotes are rounded to that and shown with cents only when they have them.
export const PRICE_STEP = 0.5;
export const PRICE_FRACTION_DIGITS = 2;

// A piece sold by the unit (an individual portion) is ordered by quantity,
// typed into the configurator; a whole piece always counts as a single unit.
export const DEFAULT_UNIT_QUANTITY = 12;
export const MIN_UNIT_QUANTITY = 5;
export const QUANTITY_STEP = 1;
export const SINGLE_UNIT = 1;

// The owner quotes round figures, never the raw cost-plus-margin result: half
// dollars while a price is small, fives from ten dollars up. The calculator
// rounds its suggestion up to the step of the band the raw figure falls in.
export interface SalePriceStep {
  readonly below: number;
  readonly step: number;
}
export const SALE_PRICE_STEPS: readonly SalePriceStep[] = [
  { below: 10, step: 0.5 },
  { below: Number.POSITIVE_INFINITY, step: 5 },
];
export const PERCENT = 100;
export const CENTS_PER_UNIT = 100;

// The catalogue lives in Workers KV as one document; the Workers read and write
// these keys, and the site fetches the public projection from this path.
export const CATALOG_KV_KEYS = {
  document: 'catalog',
  version: 'catalog:version',
  pdfVersion: 'pdf:version',
} as const;
export const CATALOG_API_PATH = 'api/catalog';

// The price list customers download: its public path on the site and its R2 key.
export const CATALOG_PDF_PUBLIC_PATH = '/ArGeles-catalogo.pdf';
export const CATALOG_PDF_KEY = 'catalog/ArGeles-catalogo.pdf';

// Uploaded photos are R2 objects under this prefix, keyed by content hash so a
// replaced photo is a new key and the old one can be cached forever.
export const PHOTO_KEY_PREFIX = 'photos/';

// A piece's id is a UUID minted by the panel; it is also the piece's URL segment.
export const PRODUCT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
