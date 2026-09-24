import type { DefaultLanguage, SupportedLanguage } from '../i18n/i18n.constants';
import type { T } from '../i18n/translation-keys.generated';

// A piece's id is a UUID the panel mints; flavours and fruit are a fixed set
// with a glyph each, so those ids stay keys of the translation file.
export type ProductId = string;
export type FlavourId = keyof typeof T.catalog.flavours;
export type FruitId = keyof typeof T.catalog.fruits;

/** How many people a piece serves, as the price list states it: from and to. */
export type PeopleRange = readonly [from: number, to: number];

/** What a visitor reads about a piece, in one language. */
export interface ProductText {
  readonly name: string;
  readonly note: string;
  readonly description: string;
}

/** The default language is mandatory; every other language is optional and falls back to it. */
export type LocalizedText = Readonly<Record<DefaultLanguage, ProductText>> &
  Readonly<Partial<Record<Exclude<SupportedLanguage, DefaultLanguage>, ProductText>>>;

/** An uploaded photo: its R2 key, its intrinsic size and the blur shown while it loads. */
export interface ProductPhoto {
  readonly key: string;
  readonly width: number;
  readonly height: number;
  readonly placeholder: string;
}

export interface Product {
  /** A UUID, also the piece's URL segment. */
  readonly id: ProductId;
  readonly text: LocalizedText;
  readonly photo: ProductPhoto;
  /** The listed price: of the whole piece, or of one unit for a piece sold by the unit. */
  readonly price: number;
  /** The people a piece serves, or null for a piece sold by the unit, which is ordered by quantity. */
  readonly serves: PeopleRange | null;
  /** The flavours the piece comes with, told to the visitor, never picked on the site; null when not stated. */
  readonly flavours: readonly FlavourId[] | null;
  /** The fruit the piece comes with, the same way. */
  readonly fruits: readonly FruitId[] | null;
}
