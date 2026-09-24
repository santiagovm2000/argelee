import {
  CACHE_CONTROL,
  CONTENT_TYPE,
  HEADER,
  HTTP_STATUS,
  READ_METHODS,
} from '../shared/http.constants';
import type { ObjectStore } from '../shared/stores';

/**
 * GET /photos/<hash>.<ext>: the uploaded original, straight from storage. The
 * key is the content hash, so the response can be cached forever; a replaced
 * photo is a new key.
 */
export async function handlePhoto(
  request: Request,
  key: string,
  store: ObjectStore,
): Promise<Response> {
  if (!READ_METHODS.includes(request.method)) {
    return new Response(null, {
      status: HTTP_STATUS.methodNotAllowed,
      headers: { [HEADER.allow]: READ_METHODS.join(', ') },
    });
  }
  const object = await store.get(key);
  if (object === null) return new Response(null, { status: HTTP_STATUS.notFound });
  return new Response(request.method === 'HEAD' ? null : object.body, {
    status: HTTP_STATUS.ok,
    headers: {
      [HEADER.contentType]: object.contentType ?? CONTENT_TYPE.binary,
      [HEADER.etag]: object.etag,
      [HEADER.cacheControl]: CACHE_CONTROL.immutable,
    },
  });
}
