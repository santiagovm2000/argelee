import { describe, expect, it } from 'vitest';
import { PORTION_SIZES } from '@core/catalog/catalog.constants';
import { PRODUCTS } from '@core/catalog/catalog.data';
import { IMAGES } from '@core/images/image-manifest.generated';

describe('menu data', () => {
  it('has unique, URL-safe ids', () => {
    const ids = PRODUCTS.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('offers at least one mould size per piece, ascending, from the known sizes', () => {
    for (const product of PRODUCTS) {
      expect(product.portions.length).toBeGreaterThan(0);
      expect([...product.portions].sort((a, b) => a - b)).toEqual([...product.portions]);
      for (const size of product.portions) expect(PORTION_SIZES).toContain(size);
    }
  });

  it('gives every piece something to configure, with defaults drawn from its own options', () => {
    for (const product of PRODUCTS) {
      const groups = [product.layers, product.fruits].filter((group) => group !== null);
      expect(groups.length).toBeGreaterThan(0);
      for (const group of groups) {
        expect(group.defaults.length).toBeGreaterThan(0);
        expect(new Set(group.options).size).toBe(group.options.length);
        for (const choice of group.defaults) expect(group.options).toContain(choice);
      }
    }
  });

  it('points every piece at a generated image', () => {
    for (const product of PRODUCTS) expect(IMAGES[product.image]).toBeDefined();
  });
});
