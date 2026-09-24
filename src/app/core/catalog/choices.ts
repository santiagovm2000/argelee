import { T } from '../i18n/translation-keys.generated';
import type { FlavourId, FruitId } from './catalog.model';

// The translation file is the registry of what a piece can offer: every id
// here has a name in every language and a glyph in public/icons/choices.
export const FLAVOUR_IDS = Object.keys(T.catalog.flavours) as readonly FlavourId[];
export const FRUIT_IDS = Object.keys(T.catalog.fruits) as readonly FruitId[];

export function isFlavourId(value: string): value is FlavourId {
  return (FLAVOUR_IDS as readonly string[]).includes(value);
}

export function isFruitId(value: string): value is FruitId {
  return (FRUIT_IDS as readonly string[]).includes(value);
}
