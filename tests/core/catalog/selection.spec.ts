import { describe, expect, it } from 'vitest';
import { DEFAULT_UNIT_QUANTITY, SINGLE_UNIT } from '@core/catalog/catalog.constants';
import { PRODUCTS } from '@core/catalog/catalog.data';
import { defaultSelection, toggleChoice } from '@core/catalog/selection';

describe('defaultSelection', () => {
  it('opens every piece as one whole piece or the default quantity, with what the photo shows', () => {
    for (const product of PRODUCTS) {
      const selection = defaultSelection(product);
      expect(selection.quantity).toBe(
        product.serves === null ? DEFAULT_UNIT_QUANTITY : SINGLE_UNIT,
      );
      expect(selection.flavours).toEqual(product.flavours?.defaults ?? []);
      expect(selection.fruits).toEqual(product.fruits?.defaults ?? []);
    }
  });
});

describe('toggleChoice', () => {
  const any = { min: 1, max: null };

  it('adds a choice that is not selected', () => {
    expect(toggleChoice(['a'], 'b', any)).toEqual(['a', 'b']);
  });

  it('removes a selected choice while the minimum still holds', () => {
    expect(toggleChoice(['a', 'b'], 'a', any)).toEqual(['b']);
  });

  it('refuses to drop below the minimum and returns the same array', () => {
    const current = ['a'] as const;
    expect(toggleChoice(current, 'a', any)).toBe(current);
  });

  it('lets an optional group empty itself', () => {
    expect(toggleChoice(['a'], 'a', { min: 0, max: null })).toEqual([]);
  });

  it('swaps the choice of a group that takes one', () => {
    expect(toggleChoice(['a'], 'b', { min: 1, max: 1 })).toEqual(['b']);
  });

  it('refuses a choice beyond the maximum and returns the same array', () => {
    const current = ['a', 'b', 'c'] as const;
    expect(toggleChoice(current, 'd', { min: 1, max: 3 })).toBe(current);
  });
});
