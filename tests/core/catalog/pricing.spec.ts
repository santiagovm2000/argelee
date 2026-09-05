import { describe, expect, it } from 'vitest';
import {
  EXTRA_FRUIT_PRICE,
  EXTRA_LAYER_PRICE,
  PORTION_PRICE_FACTOR,
  PRICE_STEP,
} from '@core/catalog/catalog.constants';
import { PRODUCTS } from '@core/catalog/catalog.data';
import type { Product } from '@core/catalog/catalog.model';
import { formatPrice, quote, startingPrice } from '@core/catalog/pricing';
import { defaultSelection } from '@core/catalog/selection';

const byId = (id: Product['id']): Product => {
  const product = PRODUCTS.find((candidate) => candidate.id === id);
  if (product === undefined) throw new Error(`no product ${id}`);
  return product;
};

const rounded = (value: number): number => Math.round(value / PRICE_STEP) * PRICE_STEP;

describe('quote', () => {
  const garden = byId('jardin-de-frutas');
  const mosaic = byId('mosaico-fresa-crema');

  it('opens at the base price for the default size with what the piece comes with', () => {
    expect(quote(mosaic, defaultSelection(mosaic))).toBe(mosaic.basePrice);
  });

  it('scales the base by the mould size', () => {
    const large = { ...defaultSelection(mosaic), portions: 16 as const };
    expect(quote(mosaic, large)).toBe(rounded(mosaic.basePrice * PORTION_PRICE_FACTOR[16]));
  });

  it('charges only the layers beyond the included ones, unscaled', () => {
    const base = defaultSelection(mosaic);
    const threeLayers = { ...base, layers: ['fresa', 'crema', 'limon'] as const };
    expect(quote(mosaic, threeLayers)).toBe(rounded(mosaic.basePrice + EXTRA_LAYER_PRICE));
  });

  it('charges only the fruit beyond the included ones, unscaled', () => {
    const base = defaultSelection(garden);
    const threeFruits = { ...base, fruits: ['fresa', 'uva', 'kiwi'] as const };
    expect(quote(garden, threeFruits)).toBe(rounded(garden.basePrice + EXTRA_FRUIT_PRICE));
  });

  it('starts a card at the smallest mould with the included choices', () => {
    expect(startingPrice(garden)).toBe(rounded(garden.basePrice * PORTION_PRICE_FACTOR[8]));
  });

  it('rounds every quote to the price step', () => {
    for (const product of PRODUCTS) {
      for (const portions of product.portions) {
        const total = quote(product, { ...defaultSelection(product), portions });
        expect(total % PRICE_STEP).toBe(0);
      }
    }
  });
});

describe('formatPrice', () => {
  it('reads as a plain dollar amount in both languages', () => {
    for (const language of ['es', 'en'] as const) {
      const formatted = formatPrice(18, language);
      expect(formatted).toContain('$');
      expect(formatted).toContain('18');
      expect(formatted).not.toContain('USD');
    }
  });
});
