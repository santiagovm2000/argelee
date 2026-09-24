import type { FlavourId, FruitId, LocalizedText, PeopleRange, ProductPhoto } from './catalog.model';
import {
  expectArray,
  expectBoolean,
  expectLocalizedText,
  expectNullable,
  expectNumber,
  expectChoices,
  expectPhoto,
  expectPrice,
  expectRecord,
  expectProductId,
  expectServes,
  expectString,
  expectUnique,
  fail,
  validate,
  type Validation,
} from './catalog.validation';
import { isFlavourId, isFruitId } from './choices';

// The whole menu as the owner edits it, stored as one JSON document in Workers
// KV. Costs and margins live here and never leave the admin Worker: the site
// only ever sees the public projection (see projection.ts).

export type MarginKind = 'percent' | 'amount';

/** What the owner adds on top of the cost: a share of it or a flat amount. */
export interface Margin {
  readonly kind: MarginKind;
  readonly value: number;
}

/** A price typed in directly, or one worked out from cost and margin; `price` is always the one quoted. */
export type Pricing =
  | { readonly mode: 'fixed'; readonly price: number }
  | {
      readonly mode: 'calculated';
      readonly cost: number;
      readonly margin: Margin;
      readonly price: number;
    };

export interface StoredProduct {
  readonly id: string;
  /** A hidden piece stays in the panel but leaves the site, the sitemap and the PDF. */
  readonly published: boolean;
  readonly text: LocalizedText;
  /** Null until a photo is uploaded; a piece cannot be published without one. */
  readonly photo: ProductPhoto | null;
  readonly pricing: Pricing;
  readonly serves: PeopleRange | null;
  readonly flavours: readonly FlavourId[] | null;
  readonly fruits: readonly FruitId[] | null;
}

export interface CatalogDocument {
  /** Changes on every save; the site and the PDF compare it to know they are current. */
  readonly version: string;
  readonly updatedAt: string;
  /** In shelf order. */
  readonly products: readonly StoredProduct[];
}

const VERSION_SUFFIX_LENGTH = 8;
const MARGIN_KINDS: readonly MarginKind[] = ['percent', 'amount'];

/** A version that sorts by time and cannot collide within the same millisecond. */
export function newCatalogVersion(now: Date = new Date()): string {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, VERSION_SUFFIX_LENGTH);
  return `${now.toISOString()}.${suffix}`;
}

function expectMargin(value: unknown, path: string): Margin {
  const record = expectRecord(value, path);
  const kind = expectString(record, 'kind', path);
  if (!(MARGIN_KINDS as readonly string[]).includes(kind)) {
    fail(`${path}.kind`, `must be one of ${MARGIN_KINDS.join(', ')}`);
  }
  return { kind: kind as MarginKind, value: expectNumber(record, 'value', path, { min: 0 }) };
}

function expectPricing(value: unknown, path: string): Pricing {
  const record = expectRecord(value, path);
  const mode = expectString(record, 'mode', path);
  const price = expectPrice(record, 'price', path);
  if (mode === 'fixed') return { mode, price };
  if (mode === 'calculated') {
    return {
      mode,
      cost: expectNumber(record, 'cost', path, { min: 0 }),
      margin: expectMargin(record['margin'], `${path}.margin`),
      price,
    };
  }
  return fail(`${path}.mode`, 'must be "fixed" or "calculated"');
}

function expectStoredProduct(value: unknown, path: string): StoredProduct {
  const record = expectRecord(value, path);
  const published = expectBoolean(record, 'published', path);
  const photo = expectNullable(record, 'photo', path, expectPhoto);
  if (published && photo === null) fail(`${path}.photo`, 'a published piece needs a photo');
  return {
    id: expectProductId(record, 'id', path),
    published,
    text: expectLocalizedText(record['text'], `${path}.text`),
    photo,
    pricing: expectPricing(record['pricing'], `${path}.pricing`),
    serves: expectNullable(record, 'serves', path, expectServes),
    flavours: expectNullable(record, 'flavours', path, (list, at) =>
      expectChoices(list, at, isFlavourId),
    ),
    fruits: expectNullable(record, 'fruits', path, (list, at) =>
      expectChoices(list, at, isFruitId),
    ),
  };
}

function readCatalogDocument(input: unknown): CatalogDocument {
  const record = expectRecord(input, 'document');
  const version = expectString(record, 'version', 'document');
  const updatedAt = expectString(record, 'updatedAt', 'document');
  if (Number.isNaN(Date.parse(updatedAt))) fail('document.updatedAt', 'must be an ISO date');
  const products = expectArray(record['products'], 'document.products').map((product, index) =>
    expectStoredProduct(product, `document.products[${index}]`),
  );
  expectUnique(
    products.map((product) => product.id),
    'document.products',
    'id',
  );
  return { version, updatedAt, products };
}

/** Checks untrusted JSON against the document contract; the result names the first problem. */
export function validateCatalogDocument(input: unknown): Validation<CatalogDocument> {
  return validate(() => readCatalogDocument(input));
}

/** Like validateCatalogDocument, for callers that would rather fail loudly. */
export function parseCatalogDocument(input: unknown): CatalogDocument {
  return readCatalogDocument(input);
}
