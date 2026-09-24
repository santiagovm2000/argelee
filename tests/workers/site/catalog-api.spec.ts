import { describe, expect, it } from 'vitest';
import { CATALOG_API_PATH } from '@core/catalog/catalog.constants';
import type { CatalogStore } from '@workers/shared/stores';
import { handleCatalogApi } from '@workers/site/catalog-api';
import { CATALOG_FIXTURE, FIXTURE_VERSION } from '../../fixtures/catalog.fixture';

const URL_UNDER_TEST = `https://argelees.com/${CATALOG_API_PATH}`;

function store(present = true): CatalogStore & { reads: number } {
  return {
    reads: 0,
    version: () => Promise.resolve(present ? FIXTURE_VERSION : null),
    document() {
      this.reads += 1;
      return Promise.resolve(present ? CATALOG_FIXTURE : null);
    },
  };
}

describe('handleCatalogApi', () => {
  it('serves the public projection with the version as ETag', async () => {
    const response = await handleCatalogApi(new Request(URL_UNDER_TEST), store());
    expect(response.status).toBe(200);
    expect(response.headers.get('ETag')).toBe(`"${FIXTURE_VERSION}"`);
    expect(response.headers.get('Cache-Control')).toContain('max-age');
    const body = (await response.json()) as {
      version: string;
      products: Record<string, unknown>[];
    };
    expect(body.version).toBe(FIXTURE_VERSION);
    expect(body.products).toHaveLength(CATALOG_FIXTURE.products.length);
    for (const product of body.products) {
      expect(product).not.toHaveProperty('pricing');
      expect(product).not.toHaveProperty('published');
      expect(product).toHaveProperty('price');
    }
  });

  it('answers a matching If-None-Match with 304 without reading the document', async () => {
    const fake = store();
    const request = new Request(URL_UNDER_TEST, {
      headers: { 'If-None-Match': `"${FIXTURE_VERSION}"` },
    });
    const response = await handleCatalogApi(request, fake);
    expect(response.status).toBe(304);
    expect(fake.reads).toBe(0);
  });

  it('serves the document when the held version is stale', async () => {
    const request = new Request(URL_UNDER_TEST, { headers: { 'If-None-Match': '"older"' } });
    expect((await handleCatalogApi(request, store())).status).toBe(200);
  });

  it('reports a missing catalogue as 404', async () => {
    const response = await handleCatalogApi(new Request(URL_UNDER_TEST), store(false));
    expect(response.status).toBe(404);
  });

  it('refuses anything but a read', async () => {
    const response = await handleCatalogApi(
      new Request(URL_UNDER_TEST, { method: 'POST' }),
      store(),
    );
    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toContain('GET');
  });
});
