import type { SupportedLanguage } from '../i18n/i18n.constants';

// Prices are the owner's price list (public/ArGeles-catalogo.pdf), in US dollars.
export const CURRENCY_CODE = 'USD';

export const PRICE_LOCALES: Readonly<Record<SupportedLanguage, string>> = {
  es: 'es-VE',
  en: 'en-US',
};

// A bare "$" reads as dollars to both audiences.
export const PRICE_DISPLAY: Readonly<Record<SupportedLanguage, 'narrowSymbol' | 'code'>> = {
  es: 'narrowSymbol',
  en: 'narrowSymbol',
};

// The list goes to the half dollar (the individual cup is $3.50), so quotes
// are rounded to that and shown with cents only when they have them.
export const PRICE_STEP = 0.5;
export const PRICE_FRACTION_DIGITS = 2;

// What a choice beyond the included ones adds, for any piece that offers extras.
export const EXTRA_LAYER_PRICE = 2;
export const EXTRA_FRUIT_PRICE = 3;

// A piece sold by the unit (an individual cup) is ordered by quantity, typed
// into the configurator; a mould always counts as a single unit.
export const DEFAULT_UNIT_QUANTITY = 12;
export const MIN_UNIT_QUANTITY = 1;
export const QUANTITY_STEP = 1;
export const SINGLE_UNIT = 1;
