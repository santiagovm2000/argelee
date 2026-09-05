import { DEFAULT_PORTIONS } from './catalog.constants';
import type { Product, Selection } from './catalog.model';

// A group never goes empty: a piece always has at least one layer or one fruit.
export const MIN_CHOICES = 1;

/** The configuration a piece opens at: the default size and what it comes with. */
export function defaultSelection(product: Product): Selection {
  return {
    portions: product.portions.includes(DEFAULT_PORTIONS)
      ? DEFAULT_PORTIONS
      : (product.portions[0] ?? DEFAULT_PORTIONS),
    layers: product.layers?.defaults ?? [],
    fruits: product.fruits?.defaults ?? [],
  };
}

/**
 * Adds or removes one choice. Removing the last one is refused and the same
 * array comes back, so a caller can tell "nothing changed" by identity.
 */
export function toggleChoice<Id extends string>(selected: readonly Id[], id: Id): readonly Id[] {
  if (selected.includes(id)) {
    return selected.length > MIN_CHOICES ? selected.filter((item) => item !== id) : selected;
  }
  return [...selected, id];
}
