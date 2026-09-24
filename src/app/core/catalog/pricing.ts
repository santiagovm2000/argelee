import type { SupportedLanguage } from '../i18n/i18n.constants';
import {
  CURRENCY_CODE,
  DEFAULT_UNIT_QUANTITY,
  PRICE_DISPLAY,
  PRICE_FRACTION_DIGITS,
  PRICE_LOCALES,
  PRICE_STEP,
  SINGLE_UNIT,
} from './catalog.constants';
import type { Product } from './catalog.model';

/** Price of an order: the listed price, times the quantity for a piece sold by the unit. */
export function quote(product: Product, quantity: number): number {
  const units = product.serves === null ? quantity : SINGLE_UNIT;
  return roundToStep(product.price * units);
}

/** The price on a card: the piece as listed, or one unit of a piece sold by the unit. */
export function listedPrice(product: Product): number {
  return quote(product, SINGLE_UNIT);
}

/** What a piece opens at: one whole piece, or the usual number of units. */
export function defaultQuantity(product: Product): number {
  return product.serves === null ? DEFAULT_UNIT_QUANTITY : SINGLE_UNIT;
}

/** Formats an amount the way a reader of that language expects to see money; cents only when there are some. */
export function formatPrice(amount: number, language: SupportedLanguage): string {
  const digits = Number.isInteger(amount) ? 0 : PRICE_FRACTION_DIGITS;
  return new Intl.NumberFormat(PRICE_LOCALES[language], {
    style: 'currency',
    currency: CURRENCY_CODE,
    currencyDisplay: PRICE_DISPLAY[language],
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

function roundToStep(value: number): number {
  return Math.round(value / PRICE_STEP) * PRICE_STEP;
}
