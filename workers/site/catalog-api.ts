import { toPublicCatalog } from '../../src/app/core/catalog/projection';
import {
  CACHE_CONTROL,
  CONTENT_TYPE,
  HEADER,
  HTTP_STATUS,
  READ_METHODS,
} from '../shared/http.constants';
import type { CatalogStore } from '../shared/stores';

function etagFor(version: string): string {
  return `"${version}"`;
}

/**
 * GET /api/catalog: the public projection with its version as ETag. A browser
 * that already holds the version gets a 304 without the document being read.
 */
export async function handleCatalogApi(request: Request, store: CatalogStore): Promise<Response> {
  if (!READ_METHODS.includes(request.method)) {
    return new Response(null, {
      status: HTTP_STATUS.methodNotAllowed,
      headers: { [HEADER.allow]: READ_METHODS.join(', ') },
    });
  }

  const version = await store.version();
  const ifNoneMatch = request.headers.get(HEADER.ifNoneMatch);
  if (version !== null && ifNoneMatch === etagFor(version)) {
    return new Response(null, {
      status: HTTP_STATUS.notModified,
      headers: { [HEADER.etag]: etagFor(version), [HEADER.cacheControl]: CACHE_CONTROL.catalog },
    });
  }

  const document = await store.document();
  if (document === null) {
    return new Response(JSON.stringify({ error: 'catalog-missing' }), {
      status: HTTP_STATUS.notFound,
      headers: { [HEADER.contentType]: CONTENT_TYPE.json },
    });
  }

  const catalog = toPublicCatalog(document);
  return new Response(JSON.stringify(catalog), {
    status: HTTP_STATUS.ok,
    headers: {
      [HEADER.contentType]: CONTENT_TYPE.json,
      [HEADER.etag]: etagFor(catalog.version),
      [HEADER.cacheControl]: CACHE_CONTROL.catalog,
    },
  });
}
