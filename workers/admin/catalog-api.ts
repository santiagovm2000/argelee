import {
  newCatalogVersion,
  validateCatalogDocument,
} from '../../src/app/core/catalog/catalog.document';
import { CACHE_CONTROL, HEADER, HTTP_STATUS } from '../shared/http.constants';
import { json, methodNotAllowed, readJson } from '../shared/http';
import type { AdminStore } from '../shared/stores';

const METHODS: readonly string[] = ['GET', 'PUT'];

function etagFor(version: string): string {
  return `"${version}"`;
}

/** GET returns the full document with its version as ETag; PUT replaces it when If-Match still holds. */
export async function handleAdminCatalog(
  request: Request,
  store: AdminStore,
  now: () => Date = () => new Date(),
): Promise<Response> {
  if (request.method === 'GET') {
    const document = await store.document();
    if (document === null)
      return json({ error: 'catalog-missing' }, { status: HTTP_STATUS.notFound });
    return json(document, {
      headers: {
        [HEADER.etag]: etagFor(document.version),
        [HEADER.cacheControl]: CACHE_CONTROL.private,
      },
    });
  }
  if (request.method !== 'PUT') return methodNotAllowed(METHODS);

  const current = await store.version();
  const ifMatch = request.headers.get(HEADER.ifMatch);
  if (current !== null && ifMatch !== etagFor(current)) {
    return json(
      { error: 'version-conflict', version: current },
      { status: HTTP_STATUS.preconditionFailed },
    );
  }

  const body = await readJson(request);
  if (typeof body !== 'object' || body === null) {
    return json({ error: 'bad-request' }, { status: HTTP_STATUS.badRequest });
  }
  const stamp = now();
  const result = validateCatalogDocument({
    ...body,
    version: newCatalogVersion(stamp),
    updatedAt: stamp.toISOString(),
  });
  if (!result.ok)
    return json({ error: 'invalid', errors: result.errors }, { status: HTTP_STATUS.unprocessable });

  await store.save(result.value);
  return json(
    { version: result.value.version, updatedAt: result.value.updatedAt },
    { headers: { [HEADER.etag]: etagFor(result.value.version) } },
  );
}
