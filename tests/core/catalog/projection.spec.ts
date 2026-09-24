import { describe, expect, it } from 'vitest';
import type { StoredProduct } from '@core/catalog/catalog.document';
import { toPublicCatalog, toPublicProduct, validatePublicCatalog } from '@core/catalog/projection';
import { CATALOG_FIXTURE, PUBLIC_CATALOG_FIXTURE } from '../../fixtures/catalog.fixture';

const stored = (): StoredProduct => {
  const product = CATALOG_FIXTURE.products[0];
  if (product === undefined) throw new Error('fixture has no products');
  return product;
};

describe('toPublicProduct', () => {
  it('quotes the price and drops how it was arrived at', () => {
    const product = toPublicProduct({
      ...stored(),
      pricing: {
        mode: 'calculated',
        cost: 18.46,
        margin: { kind: 'percent', value: 90 },
        price: 35,
      },
    });
    expect(product?.price).toBe(35);
    expect(product).not.toHaveProperty('pricing');
    expect(JSON.stringify(product)).not.toContain('18.46');
  });

  it('hides an unpublished piece and a piece without a photo', () => {
    expect(toPublicProduct({ ...stored(), published: false })).toBeNull();
    expect(toPublicProduct({ ...stored(), photo: null, published: false })).toBeNull();
  });
});

describe('toPublicCatalog', () => {
  it('keeps the version and the shelf order of the published pieces', () => {
    expect(PUBLIC_CATALOG_FIXTURE.version).toBe(CATALOG_FIXTURE.version);
    expect(PUBLIC_CATALOG_FIXTURE.products.map((product) => product.id)).toEqual(
      CATALOG_FIXTURE.products.map((product) => product.id),
    );
  });

  it('leaves out what is hidden', () => {
    const [first, ...rest] = CATALOG_FIXTURE.products;
    if (first === undefined) throw new Error('fixture has no products');
    const catalog = toPublicCatalog({
      ...CATALOG_FIXTURE,
      products: [{ ...first, published: false }, ...rest],
    });
    expect(catalog.products.map((product) => product.id)).not.toContain(first.id);
    expect(catalog.products).toHaveLength(rest.length);
  });
});

describe('validatePublicCatalog', () => {
  it('accepts what the projection produces, through JSON', () => {
    const result = validatePublicCatalog(JSON.parse(JSON.stringify(PUBLIC_CATALOG_FIXTURE)));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(PUBLIC_CATALOG_FIXTURE);
  });

  it('rejects a response missing its version or a photo', () => {
    const { products } = PUBLIC_CATALOG_FIXTURE;
    expect(validatePublicCatalog({ products }).ok).toBe(false);

    const withoutPhoto = products.map(({ photo, ...product }, index) =>
      index === 0 ? product : { ...product, photo },
    );
    const result = validatePublicCatalog({ version: 'v', products: withoutPhoto });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toContain('catalog.products[0].photo');
  });
});
