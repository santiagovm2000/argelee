import { describe, expect, it } from 'vitest';
import { PRICE_STEP } from '@core/catalog/catalog.constants';
import { PRODUCTS } from '@core/catalog/catalog.data';
import { IMAGES } from '@core/images/image-manifest.generated';

describe('menu data', () => {
  it('has unique, URL-safe ids', () => {
    const ids = PRODUCTS.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('lists every price on the price step', () => {
    for (const product of PRODUCTS) {
      expect(product.price).toBeGreaterThan(0);
      expect((product.price / PRICE_STEP) % 1).toBe(0);
    }
  });

  it('gives every whole piece an ascending range of people it serves', () => {
    for (const product of PRODUCTS) {
      if (product.serves === null) continue;
      const [from, to] = product.serves;
      expect(from).toBeGreaterThan(0);
      expect(to).toBeGreaterThanOrEqual(from);
    }
  });

  it('sells at least one piece by the unit', () => {
    expect(PRODUCTS.some((product) => product.serves === null)).toBe(true);
  });

  it('keeps every option group consistent: unique options, defaults within them and within the limits', () => {
    for (const product of PRODUCTS) {
      const groups = [product.flavours, product.fruits].filter((group) => group !== null);
      for (const group of groups) {
        expect(new Set(group.options).size).toBe(group.options.length);
        for (const choice of group.defaults) expect(group.options).toContain(choice);
        expect(group.min).toBeGreaterThanOrEqual(0);
        expect(group.defaults.length).toBeGreaterThanOrEqual(group.min);
        if (group.max !== null) {
          expect(group.max).toBeGreaterThanOrEqual(Math.max(group.min, 1));
          expect(group.defaults.length).toBeLessThanOrEqual(group.max);
        }
      }
    }
  });

  it('points every piece at a generated image', () => {
    for (const product of PRODUCTS) expect(IMAGES[product.image]).toBeDefined();
  });
});
