import type { SupportedLanguage } from '../i18n/i18n.constants';

// The mould sizes the kitchen actually makes, in servings.
export const PORTION_SIZES = [8, 12, 16] as const;
export type PortionSize = (typeof PORTION_SIZES)[number];

// The size a piece opens at; prices are quoted for it and scaled for the others.
export const DEFAULT_PORTIONS: PortionSize = 12;

// Prices are provisional, in US dollars at Venezuelan artisan-market levels,
// until the owner's real list arrives.
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

export const PORTION_PRICE_FACTOR: Readonly<Record<PortionSize, number>> = {
  8: 0.78,
  12: 1,
  16: 1.28,
};

export const EXTRA_LAYER_PRICE = 2;
export const EXTRA_FRUIT_PRICE = 3;

// Quotes are rounded to whole dollars.
export const PRICE_STEP = 1;
