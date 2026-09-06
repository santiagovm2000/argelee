import { describe, expect, it } from 'vitest';
import { DEFAULT_UNIT_QUANTITY, SINGLE_UNIT } from '@core/catalog/catalog.constants';
import { PRODUCTS } from '@core/catalog/catalog.data';
import { defaultSelection, toggleChoice } from '@core/catalog/selection';

describe('defaultSelection', () => {
  it('opens every piece as one mould or the default quantity, with what it comes with', () => {
    for (const product of PRODUCTS) {
      const selection = defaultSelection(product);
      expect(selection.quantity).toBe(product.size === null ? DEFAULT_UNIT_QUANTITY : SINGLE_UNIT);
      expect(selection.layers).toEqual(product.layers?.defaults ?? []);
      expect(selection.fruits).toEqual(product.fruits?.defaults ?? []);
    }
  });
});

describe('toggleChoice', () => {
  it('adds a choice that is not selected', () => {
    expect(toggleChoice(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes a selected choice while another remains', () => {
    expect(toggleChoice(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('refuses to remove the last choice and returns the same array', () => {
    const current = ['a'] as const;
    expect(toggleChoice(current, 'a')).toBe(current);
  });
});
