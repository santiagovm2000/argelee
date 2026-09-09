import { describe, expect, it } from 'vitest';
import { PRICE_STEP } from '@core/catalog/catalog.constants';
import { PRODUCTS } from '@core/catalog/catalog.data';
import type { Product } from '@core/catalog/catalog.model';
import { formatPrice, listedPrice, quote } from '@core/catalog/pricing';
import { defaultSelection } from '@core/catalog/selection';

const byId = (id: Product['id']): Product => {
  const product = PRODUCTS.find((candidate) => candidate.id === id);
  if (product === undefined) throw new Error(`no product ${id}`);
  return product;
};

const rounded = (value: number): number => Math.round(value / PRICE_STEP) * PRICE_STEP;

describe('quote', () => {
  const crystal = byId('encapsulada-de-frutas');
  const portion = byId('porcion-individual');

  it('prices a whole piece at its listed price, whatever the choices', () => {
    expect(quote(crystal, defaultSelection(crystal))).toBe(crystal.price);
    const everything = {
      ...defaultSelection(crystal),
      flavours: crystal.flavours?.options ?? [],
      fruits: crystal.fruits?.options ?? [],
    };
    expect(quote(crystal, everything)).toBe(crystal.price);
  });

  it('prices a piece sold by the unit per unit, times the quantity', () => {
    const dozen = 12;
    expect(listedPrice(portion)).toBe(portion.price);
    expect(quote(portion, { ...defaultSelection(portion), quantity: dozen })).toBe(
      rounded(portion.price * dozen),
    );
  });

  it('lists a whole piece on its card at the listed price', () => {
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
