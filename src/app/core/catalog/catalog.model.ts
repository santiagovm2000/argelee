import type { ImageKey } from '../images/image-manifest.generated';
import type { T } from '../i18n/translation-keys.generated';
import type { PortionSize } from './catalog.constants';

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

export interface Product {
  readonly id: ProductId;
  readonly image: ImageKey;
  readonly basePrice: number;
  readonly portions: readonly PortionSize[];
  readonly layers: OptionGroup<LayerId> | null;
  readonly fruits: OptionGroup<FruitId> | null;
}

export interface Selection {
  readonly portions: PortionSize;
  readonly layers: readonly LayerId[];
  readonly fruits: readonly FruitId[];
}
