import { CATALOG_KV_KEYS } from '../../src/app/core/catalog/catalog.constants';
import {
  type CatalogDocument,
  validateCatalogDocument,
} from '../../src/app/core/catalog/catalog.document';
import type { AdminStore, CatalogStore, ObjectStore, ObjectWriter } from './stores';

// The only place that touches KV and R2 directly. Everything else works
// through the interfaces in stores.ts.

async function readDocument(kv: KVNamespace): Promise<CatalogDocument | null> {
  const raw = await kv.get(CATALOG_KV_KEYS.document, 'json');
  if (raw === null) return null;
  const result = validateCatalogDocument(raw);
  return result.ok ? result.value : null;
}

/** The catalogue over Workers KV; a document that fails validation counts as absent rather than served broken. */
export function kvCatalogStore(kv: KVNamespace): CatalogStore {
  return {
    version: () => kv.get(CATALOG_KV_KEYS.version),
    document: () => readDocument(kv),
  };
}

/** The same namespace with the writes the panel needs. */
export function kvAdminStore(kv: KVNamespace): AdminStore {
  return {
    ...kvCatalogStore(kv),
    async save(document) {
      await kv.put(CATALOG_KV_KEYS.document, JSON.stringify(document));
      await kv.put(CATALOG_KV_KEYS.version, document.version);
    },
    pdfVersion: () => kv.get(CATALOG_KV_KEYS.pdfVersion),
    setPdfVersion: (version) => kv.put(CATALOG_KV_KEYS.pdfVersion, version),
  };
}

/** Photos and the PDF over R2, streamed as they are stored. */
export function r2ObjectStore(bucket: R2Bucket): ObjectStore {
  return {
    async get(key) {
      const object = await bucket.get(key);
      if (object === null) return null;
      return {
        body: object.body,
        contentType: object.httpMetadata?.contentType ?? null,
        etag: object.httpEtag,
      };
    },
  };
}

export function r2ObjectWriter(bucket: R2Bucket): ObjectWriter {
  return {
    ...r2ObjectStore(bucket),
    async put(key, body, contentType) {
      await bucket.put(key, body, { httpMetadata: { contentType } });
    },
  };
}
