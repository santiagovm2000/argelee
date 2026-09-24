import { PHOTO_KEY_PREFIX } from '@core/catalog/catalog.constants';
import { parseCatalogDocument, type CatalogDocument } from '@core/catalog/catalog.document';
import { toPublicCatalog } from '@core/catalog/projection';
import seed from '../../assets-src/catalog/seed/catalog.json';

// The seed is the menu the panel took over from: real pieces, texts and prices.
// Photos are files there, so the fixture stands in for what the seed script
// measures at upload time.
const FIXTURE_PHOTO_WIDTH = 1600;
const FIXTURE_PHOTO_HEIGHT = 1200;
export const FIXTURE_PLACEHOLDER = 'data:image/webp;base64,UklGRgA=';
export const FIXTURE_VERSION = '2026-09-21T12:00:00.000Z.fixture0';

interface SeedProduct {
  readonly photoFile: string;
  readonly [field: string]: unknown;
}

function withPhoto({ photoFile, ...product }: SeedProduct): Record<string, unknown> {
  return {
    ...product,
    photo: {
      key: `${PHOTO_KEY_PREFIX}${photoFile}`,
      width: FIXTURE_PHOTO_WIDTH,
      height: FIXTURE_PHOTO_HEIGHT,
      placeholder: FIXTURE_PLACEHOLDER,
    },
  };
}

/** The seed as a valid stored document, the way it sits in KV after `catalog:seed`. */
export const CATALOG_FIXTURE: CatalogDocument = parseCatalogDocument({
  version: FIXTURE_VERSION,
  updatedAt: '2026-09-21T12:00:00.000Z',
  products: (seed.products as readonly SeedProduct[]).map(withPhoto),
});

/** Plain JSON of the fixture, to be bent out of shape by validation tests. */
export function fixtureJson(): {
  version: string;
  updatedAt: string;
  products: Record<string, unknown>[];
} {
  return JSON.parse(JSON.stringify(CATALOG_FIXTURE)) as {
    version: string;
    updatedAt: string;
    products: Record<string, unknown>[];
  };
}

export const PUBLIC_CATALOG_FIXTURE = toPublicCatalog(CATALOG_FIXTURE);
export const PRODUCTS = PUBLIC_CATALOG_FIXTURE.products;
