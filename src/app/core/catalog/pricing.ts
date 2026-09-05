import type { SupportedLanguage } from '../i18n/i18n.constants';
import {
  CURRENCY_CODE,
  EXTRA_FRUIT_PRICE,
  EXTRA_LAYER_PRICE,
  PORTION_PRICE_FACTOR,
  PRICE_DISPLAY,
  PRICE_LOCALES,
  PRICE_STEP,
} from './catalog.constants';
import type { Product, Selection } from './catalog.model';
import { defaultSelection } from './selection';

/** Price of one configuration: the base scaled by size, plus what goes beyond the included choices. */
export function quote(product: Product, selection: Selection): number {
  const extraLayers = Math.max(0, selection.layers.length - (product.layers?.defaults.length ?? 0));
  const extraFruits = Math.max(0, selection.fruits.length - (product.fruits?.defaults.length ?? 0));
  return roundToStep(
    product.basePrice * PORTION_PRICE_FACTOR[selection.portions] +
      extraLayers * EXTRA_LAYER_PRICE +
      extraFruits * EXTRA_FRUIT_PRICE,
  );
}

/** The "from" price on a card: the smallest mould with what the piece comes with. */
export function startingPrice(product: Product): number {
  const smallest = product.portions.reduce((a, b) => (a < b ? a : b));
  return quote(product, { ...defaultSelection(product), portions: smallest });
}

/** Formats an amount the way a reader of that language expects to see money. */
export function formatPrice(amount: number, language: SupportedLanguage): string {
  return new Intl.NumberFormat(PRICE_LOCALES[language], {
    style: 'currency',
    currency: CURRENCY_CODE,
    currencyDisplay: PRICE_DISPLAY[language],
    maximumFractionDigits: 0,
  }).format(amount);
}

function roundToStep(value: number): number {
  return Math.round(value / PRICE_STEP) * PRICE_STEP;
}
