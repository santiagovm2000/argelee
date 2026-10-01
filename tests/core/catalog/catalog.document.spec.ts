import { describe, expect, it } from 'vitest';
import { MAX_PHOTOS_PER_PIECE, PRICE_STEP } from '@core/catalog/catalog.constants';
import {
  newCatalogVersion,
  parseCatalogDocument,
  validateCatalogDocument,
} from '@core/catalog/catalog.document';
import { CATALOG_FIXTURE, FIXTURE_PLACEHOLDER, fixtureJson } from '../../fixtures/catalog.fixture';

const UUID_SHAPE = /^[0-9a-f-]{36}$/;

const firstProduct = (json: ReturnType<typeof fixtureJson>): Record<string, unknown> => {
  const product = json.products[0];
  if (product === undefined) throw new Error('fixture has no products');
  return product;
};

const photoJson = (name: string): Record<string, unknown> => ({
  key: `photos/${name}.jpg`,
  width: 1200,
  height: 900,
  placeholder: FIXTURE_PLACEHOLDER,
});

const errorOf = (input: unknown): string => {
  const result = validateCatalogDocument(input);
  if (result.ok) throw new Error('expected the document to be rejected');
  return result.errors.join('\n');
};

describe('the seed document', () => {
  it('has unique UUID ids', () => {
    const ids = CATALOG_FIXTURE.products.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const value of ids) expect(value).toMatch(UUID_SHAPE);
  });

  it('quotes every price on the price step', () => {
    for (const product of CATALOG_FIXTURE.products) {
      expect(product.pricing.price).toBeGreaterThan(0);
      expect((product.pricing.price / PRICE_STEP) % 1).toBe(0);
    }
  });

  it('gives every whole piece an ascending range of people and sells at least one piece by the unit', () => {
    let byUnit = 0;
    for (const product of CATALOG_FIXTURE.products) {
      if (product.serves === null) {
        byUnit += 1;
        continue;
      }
      const [from, to] = product.serves;
      expect(from).toBeGreaterThan(0);
      expect(to).toBeGreaterThanOrEqual(from);
    }
    expect(byUnit).toBeGreaterThan(0);
  });

  it('round-trips through JSON unchanged', () => {
    expect(parseCatalogDocument(fixtureJson())).toEqual(CATALOG_FIXTURE);
  });
});

describe('validateCatalogDocument', () => {
  it('rejects anything that is not an object', () => {
    expect(errorOf(null)).toContain('document: must be an object');
    expect(errorOf([])).toContain('document: must be an object');
  });

  it('names the product and field that is wrong', () => {
    const json = fixtureJson();
    firstProduct(json)['id'] = 'not-a-uuid';
    expect(errorOf(json)).toBe('document.products[0].id: must be a UUID');
  });

  it('rejects a duplicate id', () => {
    const json = fixtureJson();
    const [first, second] = json.products;
    if (first === undefined || second === undefined) throw new Error('need two products');
    second['id'] = first['id'];
    expect(errorOf(json)).toContain('id');
    expect(errorOf(json)).toContain('appears more than once');
  });

  it('rejects a price off the step', () => {
    const json = fixtureJson();
    firstProduct(json)['pricing'] = { mode: 'fixed', price: 12.3 };
    expect(errorOf(json)).toContain(`must be a multiple of ${PRICE_STEP}`);
  });

  it('rejects a published piece without a photo', () => {
    const json = fixtureJson();
    firstProduct(json)['photos'] = [];
    expect(errorOf(json)).toBe('document.products[0].photos: a published piece needs a photo');
  });

  it('accepts an unpublished piece without a photo', () => {
    const json = fixtureJson();
    const product = firstProduct(json);
    product['photos'] = [];
    product['published'] = false;
    expect(validateCatalogDocument(json).ok).toBe(true);
  });

  it('keeps a gallery in the order it was given, the cover first', () => {
    const json = fixtureJson();
    const photos = [photoJson('cover'), photoJson('side'), photoJson('slice')];
    firstProduct(json)['photos'] = photos;
    expect(parseCatalogDocument(json).products[0]?.photos).toEqual(photos);
  });

  it('rejects the same photo twice and a gallery over the cap', () => {
    const repeated = fixtureJson();
    firstProduct(repeated)['photos'] = [photoJson('cover'), photoJson('cover')];
    expect(errorOf(repeated)).toContain('photos: photo "photos/cover.jpg" appears more than once');

    const crowded = fixtureJson();
    firstProduct(crowded)['photos'] = Array.from({ length: MAX_PHOTOS_PER_PIECE + 1 }, (_, index) =>
      photoJson(`view-${index}`),
    );
    expect(errorOf(crowded)).toContain(`must hold at most ${MAX_PHOTOS_PER_PIECE} photos`);
  });

  it('reads a document saved with a single photo as a gallery of one', () => {
    const json = fixtureJson();
    const [published, hidden] = json.products;
    if (published === undefined || hidden === undefined) throw new Error('need two products');
    delete published['photos'];
    published['photo'] = photoJson('legacy');
    delete hidden['photos'];
    hidden['photo'] = null;
    hidden['published'] = false;

    const [first, second] = parseCatalogDocument(json).products;
    expect(first?.photos).toEqual([photoJson('legacy')]);
    expect(second?.photos).toEqual([]);
  });

  it('requires the photos when neither shape is there', () => {
    const json = fixtureJson();
    delete firstProduct(json)['photos'];
    expect(errorOf(json)).toBe('document.products[0].photos: must be an array');
  });

  it('requires the default language and refuses an unknown one', () => {
    const withoutSpanish = fixtureJson();
    const text = firstProduct(withoutSpanish)['text'] as Record<string, unknown>;
    delete text['es'];
    expect(errorOf(withoutSpanish)).toContain('text.es: is required');

    const withKlingon = fixtureJson();
    (firstProduct(withKlingon)['text'] as Record<string, unknown>)['tlh'] = {};
    expect(errorOf(withKlingon)).toContain('text.tlh: is not a supported language');
  });

  it('accepts a piece with only the default language', () => {
    const json = fixtureJson();
    const text = firstProduct(json)['text'] as Record<string, unknown>;
    delete text['en'];
    expect(validateCatalogDocument(json).ok).toBe(true);
  });

  it('rejects a flavour the glyph set does not know, an empty list and a repeat', () => {
    const unknown = fixtureJson();
    firstProduct(unknown)['flavours'] = ['strawberry', 'durian'];
    expect(errorOf(unknown)).toContain('flavours[1]: is not a known choice');

    const empty = fixtureJson();
    firstProduct(empty)['flavours'] = [];
    expect(errorOf(empty)).toContain('flavours: must name at least one');

    const repeated = fixtureJson();
    firstProduct(repeated)['fruits'] = ['grape', 'grape'];
    expect(errorOf(repeated)).toContain('appears more than once');
  });

  it('accepts calculated pricing and rejects an unknown margin kind', () => {
    const json = fixtureJson();
    const product = firstProduct(json);
    product['pricing'] = {
      mode: 'calculated',
      cost: 18.46,
      margin: { kind: 'percent', value: 90 },
      price: 35,
    };
    expect(validateCatalogDocument(json).ok).toBe(true);

    product['pricing'] = {
      mode: 'calculated',
      cost: 18.46,
      margin: { kind: 'x', value: 1 },
      price: 35,
    };
    expect(errorOf(json)).toContain('pricing.margin.kind: must be one of percent, amount');
  });

  it('rejects an unknown pricing mode and a non-ISO date', () => {
    const json = fixtureJson();
    firstProduct(json)['pricing'] = { mode: 'guess', price: 10 };
    expect(errorOf(json)).toContain('pricing.mode: must be "fixed" or "calculated"');

    const dated = fixtureJson();
    dated.updatedAt = 'yesterday';
    expect(errorOf(dated)).toContain('document.updatedAt: must be an ISO date');
  });
});

describe('newCatalogVersion', () => {
  it('sorts by time and never repeats', () => {
    const earlier = newCatalogVersion(new Date('2026-01-01T00:00:00.000Z'));
    const later = newCatalogVersion(new Date('2026-01-02T00:00:00.000Z'));
    expect(earlier < later).toBe(true);
    expect(newCatalogVersion()).not.toBe(newCatalogVersion());
  });
});
