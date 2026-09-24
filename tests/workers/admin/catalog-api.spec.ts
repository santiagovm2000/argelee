import { describe, expect, it } from 'vitest';
import type { CatalogDocument } from '@core/catalog/catalog.document';
import { handleAdminCatalog } from '@workers/admin/catalog-api';
import { handleStatus, pdfState } from '@workers/admin/status';
import type { AdminStore } from '@workers/shared/stores';
import { CATALOG_FIXTURE, FIXTURE_VERSION } from '../../fixtures/catalog.fixture';

const URL_UNDER_TEST = 'https://admin.argelees.com/api/catalog';
const NOW = new Date('2026-09-22T15:00:00.000Z');

interface FakeStore extends AdminStore {
  saved: CatalogDocument[];
  pdf: string | null;
}

function store(
  document: CatalogDocument | null = CATALOG_FIXTURE,
  pdf: string | null = null,
): FakeStore {
  let current = document;
  const fake: FakeStore = {
    saved: [],
    pdf,
    version: () => Promise.resolve(current?.version ?? null),
    document: () => Promise.resolve(current),
    save(next) {
      fake.saved.push(next);
      current = next;
      return Promise.resolve();
    },
    pdfVersion: () => Promise.resolve(fake.pdf),
    setPdfVersion(version) {
      fake.pdf = version;
      return Promise.resolve();
    },
  };
  return fake;
}

function put(body: unknown, ifMatch: string | null): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ifMatch !== null) headers['If-Match'] = ifMatch;
  return new Request(URL_UNDER_TEST, { method: 'PUT', headers, body: JSON.stringify(body) });
}

describe('handleAdminCatalog GET', () => {
  it('returns the whole document, costs included, with its version as ETag', async () => {
    const response = await handleAdminCatalog(new Request(URL_UNDER_TEST), store());
    expect(response.status).toBe(200);
    expect(response.headers.get('ETag')).toBe(`"${FIXTURE_VERSION}"`);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const body = (await response.json()) as CatalogDocument;
    expect(body.products[0]).toHaveProperty('pricing');
  });
});

describe('handleAdminCatalog PUT', () => {
  it('saves a valid document under a fresh version when If-Match holds', async () => {
    const fake = store();
    const edited = { ...CATALOG_FIXTURE, products: CATALOG_FIXTURE.products.slice(1) };
    const response = await handleAdminCatalog(put(edited, `"${FIXTURE_VERSION}"`), fake, () => NOW);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { version: string; updatedAt: string };
    expect(body.version).not.toBe(FIXTURE_VERSION);
    expect(body.version.startsWith(NOW.toISOString())).toBe(true);
    expect(body.updatedAt).toBe(NOW.toISOString());
    expect(fake.saved[0]?.products).toHaveLength(CATALOG_FIXTURE.products.length - 1);
    expect(response.headers.get('ETag')).toBe(`"${body.version}"`);
  });

  it('refuses to overwrite a newer version', async () => {
    const fake = store();
    const response = await handleAdminCatalog(put(CATALOG_FIXTURE, '"older"'), fake, () => NOW);
    expect(response.status).toBe(412);
    expect(((await response.json()) as { version: string }).version).toBe(FIXTURE_VERSION);
    expect(fake.saved).toHaveLength(0);
    expect((await handleAdminCatalog(put(CATALOG_FIXTURE, null), fake, () => NOW)).status).toBe(
      412,
    );
  });

  it('rejects an invalid document with the reason and keeps the old one', async () => {
    const fake = store();
    const broken = {
      ...CATALOG_FIXTURE,
      products: [{ ...CATALOG_FIXTURE.products[0], pricing: { mode: 'fixed', price: 12.3 } }],
    };
    const response = await handleAdminCatalog(put(broken, `"${FIXTURE_VERSION}"`), fake, () => NOW);
    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: string[] };
    expect(body.errors[0]).toContain('pricing.price');
    expect(fake.saved).toHaveLength(0);
  });

  it('accepts the first document when nothing is stored yet', async () => {
    const fake = store(null);
    const response = await handleAdminCatalog(put(CATALOG_FIXTURE, null), fake, () => NOW);
    expect(response.status).toBe(200);
    expect(fake.saved).toHaveLength(1);
  });

  it('refuses other methods', async () => {
    const response = await handleAdminCatalog(
      new Request(URL_UNDER_TEST, { method: 'DELETE' }),
      store(),
    );
    expect(response.status).toBe(405);
  });
});

describe('status', () => {
  it('tells whether the PDF matches the catalogue', async () => {
    expect(pdfState('v2', null)).toBe('missing');
    expect(pdfState('v2', 'v1')).toBe('stale');
    expect(pdfState('v2', 'v2')).toBe('current');
    const response = await handleStatus(store(CATALOG_FIXTURE, FIXTURE_VERSION));
    const body = (await response.json()) as { pdfState: string; catalogVersion: string };
    expect(body.catalogVersion).toBe(FIXTURE_VERSION);
    expect(body.pdfState).toBe('current');
  });
});
