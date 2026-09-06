import type { ImageKey } from '../images/image-manifest.generated';
import type { T } from '../i18n/translation-keys.generated';

// Identifiers are the keys of the translation file, so a piece, a layer or a
// fruit cannot exist without a name in every language, and a typo is a compile error.
export type ProductId = keyof typeof T.catalog.products;
export type LayerId = keyof typeof T.catalog.layers;
export type FruitId = keyof typeof T.catalog.fruits;

/** The choices a group offers, and the ones a piece comes with (included in the price). */
export interface OptionGroup<Id extends string> {
  readonly options: readonly Id[];
  readonly defaults: readonly Id[];
}

/** The mould a piece is made in: its volume, and how many people it serves. */
export interface MouldSize {
  readonly litres: number;
  readonly serves: readonly [from: number, to: number];
}

export interface Product {
  readonly id: ProductId;
  readonly image: ImageKey;
  /** The listed price: of the whole piece, or of one unit for a piece sold by the unit. */
  readonly price: number;
  /** The mould, or null for a piece sold by the unit, which is ordered by quantity. */
  readonly size: MouldSize | null;
  readonly layers: OptionGroup<LayerId> | null;
  readonly fruits: OptionGroup<FruitId> | null;
}

export interface Selection {
  /** How many of a piece sold by the unit; a mould is always one. */
  readonly quantity: number;
  readonly layers: readonly LayerId[];
  readonly fruits: readonly FruitId[];
}
