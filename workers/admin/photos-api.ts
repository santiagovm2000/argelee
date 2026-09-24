import { PHOTO_KEY_PREFIX } from '../../src/app/core/catalog/catalog.constants';
import { HEADER, HTTP_STATUS } from '../shared/http.constants';
import { json, methodNotAllowed } from '../shared/http';
import type { ObjectWriter } from '../shared/stores';

const SHA256_HEX_LENGTH = 64;
const PHOTO_KEY_PATTERN = new RegExp(
  `^${PHOTO_KEY_PREFIX}[a-f0-9]{${SHA256_HEX_LENGTH}}\\.(jpg|png|webp)$`,
);
const CONTENT_TYPES: Readonly<Record<string, string>> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
const METHODS: readonly string[] = ['PUT'];
export const MAX_PHOTO_BYTES = 12_582_912;

/** PUT /api/photos/<sha256>.<ext>: stores the body under its content-addressed key. The panel downsizes to about 2 MB first, so 12 MB is already generous. */
export async function handlePhotoUpload(
  request: Request,
  key: string,
  store: ObjectWriter,
): Promise<Response> {
  if (request.method !== 'PUT') return methodNotAllowed(METHODS);
  if (!PHOTO_KEY_PATTERN.test(key)) {
    return json({ error: 'bad-photo-key' }, { status: HTTP_STATUS.badRequest });
  }
  const size = Number(request.headers.get('Content-Length') ?? '0');
  if (size > MAX_PHOTO_BYTES) {
    return json({ error: 'photo-too-large' }, { status: HTTP_STATUS.payloadTooLarge });
  }
  const extension = key.slice(key.lastIndexOf('.') + 1);
  const contentType = CONTENT_TYPES[extension];
  if (contentType === undefined || request.body === null) {
    return json({ error: 'bad-request' }, { status: HTTP_STATUS.badRequest });
  }
  await store.put(key, request.body, contentType);
  return json(
    { key },
    { status: HTTP_STATUS.created, headers: { [HEADER.cacheControl]: 'no-store' } },
  );
}
