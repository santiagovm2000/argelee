import type { ImageKey } from '../images/image-manifest.generated';
import type { T } from '../i18n/translation-keys.generated';

// Identifiers are the keys of the translation file, so a piece, a flavour or a
// fruit cannot exist without a name in every language, and a typo is a compile error.
export type ProductId = keyof typeof T.catalog.products;
export type FlavourId = keyof typeof T.catalog.flavours;
export type FruitId = keyof typeof T.catalog.fruits;

/** How many choices a group takes: the fewest allowed (0 makes it optional) and the most, or null for any number. */
export interface ChoiceLimits {
  readonly min: number;
  readonly max: number | null;
}

/** The choices a group offers, its limits, and what the piece opens with. */
export interface OptionGroup<Id extends string> extends ChoiceLimits {
  readonly options: readonly Id[];
  readonly defaults: readonly Id[];
}

/** How many people a piece serves, as the price list states it: from and to. */
export type PeopleRange = readonly [from: number, to: number];

export interface Product {
  readonly id: ProductId;
  /** The URL segment: the piece's own name, in Spanish, because that is what the brand calls it. */
  readonly slug: string;
  readonly image: ImageKey;
  /** The listed price: of the whole piece, or of one unit for a piece sold by the unit. */
  readonly price: number;
  /** The people a piece serves, or null for a piece sold by the unit, which is ordered by quantity. */
  readonly serves: PeopleRange | null;
  readonly flavours: OptionGroup<FlavourId> | null;
  readonly fruits: OptionGroup<FruitId> | null;
}

export interface Selection {
  /** How many of a piece sold by the unit; a whole piece is always one. */
  readonly quantity: number;
  readonly flavours: readonly FlavourId[];
  readonly fruits: readonly FruitId[];
}
