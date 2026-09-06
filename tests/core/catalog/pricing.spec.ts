import { describe, expect, it } from 'vitest';
import { EXTRA_FRUIT_PRICE, EXTRA_LAYER_PRICE, PRICE_STEP } from '@core/catalog/catalog.constants';
import { PRODUCTS } from '@core/catalog/catalog.data';
import type { Product } from '@core/catalog/catalog.model';
import { formatNumber, formatPrice, listedPrice, quote } from '@core/catalog/pricing';
import { defaultSelection } from '@core/catalog/selection';

const byId = (id: Product['id']): Product => {
  const product = PRODUCTS.find((candidate) => candidate.id === id);
  if (product === undefined) throw new Error(`no product ${id}`);
  return product;
};

const rounded = (value: number): number => Math.round(value / PRICE_STEP) * PRICE_STEP;

// A mould with extras on offer, to exercise the mechanism whatever the menu lists today.
const withExtras = (product: Product): Product => ({
  ...product,
  layers: { options: ['fresa', 'crema', 'limon'], defaults: ['fresa', 'crema'] },
  fruits: { options: ['fresa', 'uva', 'kiwi'], defaults: ['fresa', 'uva'] },
});

describe('quote', () => {
  const crystal = byId('frutas-en-capa-cristalina');
  const cup = byId('fresa-en-envase-individual');

  it('opens a mould at its listed price with what the piece comes with', () => {
    expect(quote(crystal, defaultSelection(crystal))).toBe(crystal.price);
  });

  it('charges only the layers beyond the included ones', () => {
    const piece = withExtras(crystal);
    const threeLayers = {
      ...defaultSelection(piece),
      layers: ['fresa', 'crema', 'limon'] as const,
    };
    expect(quote(piece, threeLayers)).toBe(rounded(piece.price + EXTRA_LAYER_PRICE));
  });

  it('charges only the fruit beyond the included ones', () => {
    const piece = withExtras(crystal);
    const threeFruits = { ...defaultSelection(piece), fruits: ['fresa', 'uva', 'kiwi'] as const };
    expect(quote(piece, threeFruits)).toBe(rounded(piece.price + EXTRA_FRUIT_PRICE));
  });

  it('prices a piece sold by the unit per unit, times the quantity', () => {
    const dozen = 12;
    expect(listedPrice(cup)).toBe(cup.price);
    expect(quote(cup, { ...defaultSelection(cup), quantity: dozen })).toBe(
      rounded(cup.price * dozen),
    );
  });

  it('lists a mould on its card at the listed price', () => {
    expect(listedPrice(crystal)).toBe(crystal.price);
  });

  it('rounds every quote to the price step', () => {
    for (const product of PRODUCTS) {
      const total = quote(product, defaultSelection(product));
      expect((total / PRICE_STEP) % 1).toBe(0);
    }
  });
});

describe('formatPrice', () => {
  it('reads as a plain dollar amount in both languages', () => {
    for (const language of ['es', 'en'] as const) {
      const formatted = formatPrice(60, language);
      expect(formatted).toContain('$');
      expect(formatted).toContain('60');
      expect(formatted).not.toContain('USD');
      expect(formatted).not.toContain('60.00');
      expect(formatted).not.toContain('60,00');
    }
  });

  it('keeps the cents of a half-dollar price', () => {
    expect(formatPrice(3.5, 'en')).toBe('$3.50');
    expect(formatPrice(3.5, 'es')).toContain('3,50');
  });
});

describe('formatNumber', () => {
  it('writes litres with the decimal mark of the language', () => {
    expect(formatNumber(1.6, 'en')).toBe('1.6');
    expect(formatNumber(1.6, 'es')).toBe('1,6');
    expect(formatNumber(2, 'es')).toBe('2');
  });
});
