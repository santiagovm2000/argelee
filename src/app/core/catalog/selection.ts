import { DEFAULT_UNIT_QUANTITY, SINGLE_UNIT } from './catalog.constants';
import type { ChoiceLimits, Product, Selection } from './catalog.model';

/** The configuration a piece opens at: one whole piece or the default quantity, with what the photo shows. */
export function defaultSelection(product: Product): Selection {
  return {
    quantity: product.serves === null ? DEFAULT_UNIT_QUANTITY : SINGLE_UNIT,
    flavours: product.flavours?.defaults ?? [],
    fruits: product.fruits?.defaults ?? [],
  };
}

/**
 * Adds or removes one choice within the group's limits. A group that takes a
 * single choice swaps it; a full group and a group at its minimum refuse, and
 * the same array comes back so a caller can tell "nothing changed" by identity.
 */
export function toggleChoice<Id extends string>(
  selected: readonly Id[],
  id: Id,
  limits: ChoiceLimits,
): readonly Id[] {
  if (selected.includes(id)) {
    return selected.length > limits.min ? selected.filter((item) => item !== id) : selected;
  }
  if (limits.max !== null && selected.length >= limits.max) {
    return limits.max === 1 ? [id] : selected;
  }
  return [...selected, id];
}
