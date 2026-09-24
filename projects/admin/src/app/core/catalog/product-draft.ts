import type { Margin, MarginKind, Pricing, StoredProduct } from '@core/catalog/catalog.document';
import type { FlavourId, FruitId, ProductPhoto, ProductText } from '@core/catalog/catalog.model';
import { roundToPriceStep } from '@core/catalog/costing';
import { DEFAULT_LANGUAGE } from '@core/i18n/i18n.constants';
import { DEFAULT_MARGIN_PERCENT, DEFAULT_PRICE, DEFAULT_SERVES } from '../config/admin.constants';

// The editable shape of a piece: flat, every field always present, so a form
// can bind to it. `toStoredProduct` folds it back into what the catalogue stores.

/** Whether the piece states its flavours (or fruit), and which. */
export interface OptionDraft<Id extends string> {
  readonly enabled: boolean;
  readonly options: readonly Id[];
}

export interface ProductDraft {
  readonly id: string;
  readonly published: boolean;
  readonly es: ProductText;
  readonly byUnit: boolean;
  readonly servesFrom: number;
  readonly servesTo: number;
  readonly flavours: OptionDraft<FlavourId>;
  readonly fruits: OptionDraft<FruitId>;
  readonly pricingMode: Pricing['mode'];
  readonly cost: number;
  readonly marginKind: MarginKind;
  readonly marginValue: number;
  readonly price: number;
  readonly photo: ProductPhoto | null;
}

const EMPTY_TEXT: ProductText = { name: '', note: '', description: '' };

function emptyOptions<Id extends string>(): OptionDraft<Id> {
  return { enabled: false, options: [] };
}

function optionsDraft<Id extends string>(choices: readonly Id[] | null): OptionDraft<Id> {
  return choices === null ? emptyOptions() : { enabled: true, options: choices };
}

function choicesOf<Id extends string>(draft: OptionDraft<Id>): readonly Id[] | null {
  return draft.enabled ? [...draft.options] : null;
}

/** A fresh id for a piece created in the panel. */
export function newProductId(): string {
  return crypto.randomUUID();
}

export function emptyDraft(): ProductDraft {
  return {
    id: newProductId(),
    published: false,
    es: EMPTY_TEXT,
    byUnit: false,
    servesFrom: DEFAULT_SERVES[0],
    servesTo: DEFAULT_SERVES[1],
    flavours: emptyOptions(),
    fruits: emptyOptions(),
    pricingMode: 'fixed',
    cost: 0,
    marginKind: 'percent',
    marginValue: DEFAULT_MARGIN_PERCENT,
    price: DEFAULT_PRICE,
    photo: null,
  };
}

export function toDraft(product: StoredProduct): ProductDraft {
  const pricing = product.pricing;
  return {
    id: product.id,
    published: product.published,
    es: product.text[DEFAULT_LANGUAGE],
    byUnit: product.serves === null,
    servesFrom: product.serves?.[0] ?? DEFAULT_SERVES[0],
    servesTo: product.serves?.[1] ?? DEFAULT_SERVES[1],
    flavours: optionsDraft(product.flavours),
    fruits: optionsDraft(product.fruits),
    pricingMode: pricing.mode,
    cost: pricing.mode === 'calculated' ? pricing.cost : 0,
    marginKind: pricing.mode === 'calculated' ? pricing.margin.kind : 'percent',
    marginValue: pricing.mode === 'calculated' ? pricing.margin.value : DEFAULT_MARGIN_PERCENT,
    price: pricing.price,
    photo: product.photo,
  };
}

function trimmed(text: ProductText): ProductText {
  return {
    name: text.name.trim(),
    note: text.note.trim(),
    description: text.description.trim(),
  };
}

function pricingOf(draft: ProductDraft): Pricing {
  const price = roundToPriceStep(draft.price);
  if (draft.pricingMode === 'fixed') return { mode: 'fixed', price };
  const margin: Margin = { kind: draft.marginKind, value: draft.marginValue };
  return { mode: 'calculated', cost: draft.cost, margin, price };
}

/** Folds the draft back into a stored piece. */
export function toStoredProduct(draft: ProductDraft): StoredProduct {
  return {
    id: draft.id,
    published: draft.published,
    text: { [DEFAULT_LANGUAGE]: trimmed(draft.es) },
    photo: draft.photo,
    pricing: pricingOf(draft),
    serves: draft.byUnit ? null : [draft.servesFrom, draft.servesTo],
    flavours: choicesOf(draft.flavours),
    fruits: choicesOf(draft.fruits),
  };
}
