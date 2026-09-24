import { describe, expect, it } from 'vitest';
import { DEFAULT_UNIT_QUANTITY, PRICE_STEP, SINGLE_UNIT } from '@core/catalog/catalog.constants';
import type { Product } from '@core/catalog/catalog.model';
import { defaultQuantity, formatPrice, listedPrice, quote } from '@core/catalog/pricing';
import { PRODUCTS } from '../../fixtures/catalog.fixture';

const byName = (name: string): Product => {
  const product = PRODUCTS.find((candidate) => candidate.text.es.name === name);
  if (product === undefined) throw new Error(`no product ${name}`);
  return product;
};

const rounded = (value: number): number => Math.round(value / PRICE_STEP) * PRICE_STEP;

describe('quote', () => {
  const crystal = byName('Encapsulada de frutas');
  const portion = byName('Porción individual');

  it('prices a whole piece at its listed price, whatever the quantity asked', () => {
    expect(quote(crystal, SINGLE_UNIT)).toBe(crystal.price);
    expect(quote(crystal, DEFAULT_UNIT_QUANTITY)).toBe(crystal.price);
  });

  it('prices a piece sold by the unit per unit, times the quantity', () => {
    const dozen = 12;
    expect(listedPrice(portion)).toBe(portion.price);
    expect(quote(portion, dozen)).toBe(rounded(portion.price * dozen));
  });

  it('opens a whole piece at one and a unit piece at the usual quantity', () => {
    expect(defaultQuantity(crystal)).toBe(SINGLE_UNIT);
    expect(defaultQuantity(portion)).toBe(DEFAULT_UNIT_QUANTITY);
  });

  it('lists a whole piece on its card at the listed price', () => {
    expect(listedPrice(crystal)).toBe(crystal.price);
  });

  it('rounds every quote to the price step', () => {
    for (const product of PRODUCTS) {
      const total = quote(product, defaultQuantity(product));
      expect((total / PRICE_STEP) % 1).toBe(0);
    }
  });
});

describe('formatPrice', () => {
  it('reads as a plain dollar amount', () => {
    const formatted = formatPrice(60, 'es');
    expect(formatted).toContain('$');
    expect(formatted).toContain('60');
    expect(formatted).not.toContain('USD');
    expect(formatted).not.toContain('60,00');
  });

  it('keeps the cents of a half-dollar price', () => {
    expect(formatPrice(3.5, 'es')).toContain('3,50');
  });
});
