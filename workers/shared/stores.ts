import type { CatalogDocument } from '../../src/app/core/catalog/catalog.document';

// The storage the handlers read and write through. They are plain interfaces
// so the handlers can be exercised with in-memory fakes; the Workers bind them
// to KV and R2 in cloudflare-stores.ts, the only file that knows Cloudflare.

export interface CatalogStore {
  /** The current version alone, cheap enough to answer a conditional request without the document. */
  version(): Promise<string | null>;
  document(): Promise<CatalogDocument | null>;
}

/** What the admin Worker adds: writing the catalogue and tracking which version the PDF was made from. */
export interface AdminStore extends CatalogStore {
  save(document: CatalogDocument): Promise<void>;
  pdfVersion(): Promise<string | null>;
  setPdfVersion(version: string): Promise<void>;
}

export interface StoredObject {
  readonly body: ReadableStream;
  readonly contentType: string | null;
  readonly etag: string;
}

export interface ObjectStore {
  get(key: string): Promise<StoredObject | null>;
}

export interface ObjectWriter extends ObjectStore {
  put(key: string, body: ReadableStream | ArrayBuffer, contentType: string): Promise<void>;
}
