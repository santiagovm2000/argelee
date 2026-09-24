import type { CatalogDocument, StoredProduct } from './catalog.document';
import type { Product } from './catalog.model';
import {
  expectArray,
  expectLocalizedText,
  expectNullable,
  expectChoices,
  expectPhoto,
  expectPrice,
  expectRecord,
  expectProductId,
  expectServes,
  expectString,
  expectUnique,
  validate,
  type Validation,
} from './catalog.validation';
import { isFlavourId, isFruitId } from './choices';

// What the site is allowed to know: published pieces with a photo, their
// quoted price and nothing about how it was arrived at. The public Worker
// serves this shape, the build snapshots it, and the browser refreshes it.

export interface PublicCatalog {
  readonly version: string;
  readonly products: readonly Product[];
}

/** A published piece with a photo becomes a product; anything else is not for visitors. */
export function toPublicProduct(stored: StoredProduct): Product | null {
  if (!stored.published || stored.photo === null) return null;
  return {
    id: stored.id,
    text: stored.text,
    photo: stored.photo,
    price: stored.pricing.price,
    serves: stored.serves,
    flavours: stored.flavours,
    fruits: stored.fruits,
  };
}

export function toPublicCatalog(document: CatalogDocument): PublicCatalog {
  return {
    version: document.version,
    products: document.products
      .map(toPublicProduct)
      .filter((product): product is Product => product !== null),
  };
}

function expectProduct(value: unknown, path: string): Product {
  const record = expectRecord(value, path);
  return {
    id: expectProductId(record, 'id', path),
    text: expectLocalizedText(record['text'], `${path}.text`),
    photo: expectPhoto(record['photo'], `${path}.photo`),
    price: expectPrice(record, 'price', path),
    serves: expectNullable(record, 'serves', path, expectServes),
    flavours: expectNullable(record, 'flavours', path, (list, at) =>
      expectChoices(list, at, isFlavourId),
    ),
    fruits: expectNullable(record, 'fruits', path, (list, at) =>
      expectChoices(list, at, isFruitId),
    ),
  };
}

function readPublicCatalog(input: unknown): PublicCatalog {
  const record = expectRecord(input, 'catalog');
  const products = expectArray(record['products'], 'catalog.products').map((product, index) =>
    expectProduct(product, `catalog.products[${index}]`),
  );
  expectUnique(
    products.map((product) => product.id),
    'catalog.products',
    'id',
  );
  return { version: expectString(record, 'version', 'catalog'), products };
}

/** Checks what came back from the API before it replaces the build-time snapshot. */
export function validatePublicCatalog(input: unknown): Validation<PublicCatalog> {
  return validate(() => readPublicCatalog(input));
}
