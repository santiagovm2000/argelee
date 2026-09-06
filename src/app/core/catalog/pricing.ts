import type { SupportedLanguage } from '../i18n/i18n.constants';
import {
  CURRENCY_CODE,
  EXTRA_FRUIT_PRICE,
  EXTRA_LAYER_PRICE,
  PRICE_DISPLAY,
  PRICE_FRACTION_DIGITS,
  PRICE_LOCALES,
  PRICE_STEP,
  SINGLE_UNIT,
} from './catalog.constants';
import type { Product, Selection } from './catalog.model';
import { defaultSelection } from './selection';

/**
 * Price of one configuration: the listed price plus what goes beyond the
 * included choices; a piece sold by the unit is that, times the quantity.
 */
export function quote(product: Product, selection: Selection): number {
  const extraLayers = Math.max(0, selection.layers.length - (product.layers?.defaults.length ?? 0));
  const extraFruits = Math.max(0, selection.fruits.length - (product.fruits?.defaults.length ?? 0));
  const units = product.size === null ? selection.quantity : SINGLE_UNIT;
  return roundToStep(
    (product.price + extraLayers * EXTRA_LAYER_PRICE + extraFruits * EXTRA_FRUIT_PRICE) * units,
  );
}

/** The price on a card: the piece as listed, or one unit of a piece sold by the unit. */
export function listedPrice(product: Product): number {
  return quote(product, { ...defaultSelection(product), quantity: SINGLE_UNIT });
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

/** A plain quantity, such as a mould's litres, in the reader's decimal notation. */
export function formatNumber(value: number, language: SupportedLanguage): string {
  return new Intl.NumberFormat(PRICE_LOCALES[language]).format(value);
}

function roundToStep(value: number): number {
  return Math.round(value / PRICE_STEP) * PRICE_STEP;
}
