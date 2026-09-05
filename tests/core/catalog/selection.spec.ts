import { describe, expect, it } from 'vitest';
import { DEFAULT_PORTIONS } from '@core/catalog/catalog.constants';
import { PRODUCTS } from '@core/catalog/catalog.data';
import { defaultSelection, toggleChoice } from '@core/catalog/selection';

describe('defaultSelection', () => {
  it('opens every piece at the default size with what it comes with', () => {
    for (const product of PRODUCTS) {
      const selection = defaultSelection(product);
      expect(selection.portions).toBe(DEFAULT_PORTIONS);
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
