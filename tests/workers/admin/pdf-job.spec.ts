import { describe, expect, it } from 'vitest';
import { CATALOG_PDF_KEY } from '@core/catalog/catalog.constants';
import type { CatalogDocument } from '@core/catalog/catalog.document';
import { handlePdf, type PdfRenderer } from '@workers/admin/pdf-job';
import type { AdminStore, ObjectWriter } from '@workers/shared/stores';
import { CATALOG_FIXTURE, FIXTURE_VERSION } from '../../fixtures/catalog.fixture';

interface FakeStore extends AdminStore {
  pdf: string | null;
}

function store(document: CatalogDocument | null = CATALOG_FIXTURE): FakeStore {
  const fake: FakeStore = {
    pdf: null,
    version: () => Promise.resolve(document?.version ?? null),
    document: () => Promise.resolve(document),
    save: () => Promise.resolve(),
    pdfVersion: () => Promise.resolve(fake.pdf),
    setPdfVersion(version) {
      fake.pdf = version;
      return Promise.resolve();
    },
  };
  return fake;
}

function media(): ObjectWriter & { objects: Map<string, string> } {
  const objects = new Map<string, string>();
  return {
    objects,
    get: () => Promise.resolve(null),
    put(key, _body, contentType) {
      objects.set(key, contentType);
      return Promise.resolve();
    },
  };
}

const renderer: PdfRenderer = { render: () => Promise.resolve(new ArrayBuffer(8)) };
const buildHtml = (catalog: { products: readonly unknown[] }): string =>
  `<html>${String(catalog.products.length)}</html>`;

describe('handlePdf', () => {
  it('renders the published catalogue, stores the PDF and records the version', async () => {
    const fake = store();
    const bucket = media();
    const response = await handlePdf(fake, bucket, renderer, buildHtml);
    expect(response.status).toBe(200);
    expect(bucket.objects.get(CATALOG_PDF_KEY)).toBe('application/pdf');
    expect(fake.pdf).toBe(FIXTURE_VERSION);
  });

  it('says so when no renderer is configured or the catalogue is missing', async () => {
    expect((await handlePdf(store(), media(), null, buildHtml)).status).toBe(503);
    expect((await handlePdf(store(null), media(), renderer, buildHtml)).status).toBe(404);
  });

  it('reports a rendering failure without touching storage', async () => {
    const failing: PdfRenderer = { render: () => Promise.reject(new Error('boom')) };
    const fake = store();
    const bucket = media();
    const response = await handlePdf(fake, bucket, failing, buildHtml);
    expect(response.status).toBe(503);
    expect(bucket.objects.size).toBe(0);
    expect(fake.pdf).toBeNull();
  });
});
