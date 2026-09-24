import { describe, expect, it } from 'vitest';
import { handlePhotoUpload, MAX_PHOTO_BYTES } from '@workers/admin/photos-api';
import type { ObjectWriter } from '@workers/shared/stores';

const KEY = `photos/${'a'.repeat(64)}.jpg`;

function writer(): ObjectWriter & { readonly puts: { key: string; contentType: string }[] } {
  const puts: { key: string; contentType: string }[] = [];
  return {
    puts,
    get: () => Promise.resolve(null),
    put(key, _body, contentType) {
      puts.push({ key, contentType });
      return Promise.resolve();
    },
  };
}

function upload(key: string, size: number, method = 'PUT'): Request {
  return new Request(`https://admin.argelees.com/api/photos/${key}`, {
    method,
    headers: { 'Content-Length': String(size) },
    body: method === 'PUT' ? new Uint8Array(1) : null,
  });
}

describe('handlePhotoUpload', () => {
  it('stores a photo under its content-addressed key with the type its extension says', async () => {
    const store = writer();
    const response = await handlePhotoUpload(upload(KEY, 1), KEY, store);
    expect(response.status).toBe(201);
    expect(store.puts).toEqual([{ key: KEY, contentType: 'image/jpeg' }]);
  });

  it('refuses a key that is not a hash, a wrong method and a body past the size limit', async () => {
    const store = writer();
    expect(
      (await handlePhotoUpload(upload('photos/../x.jpg', 1), 'photos/../x.jpg', store)).status,
    ).toBe(400);
    expect((await handlePhotoUpload(upload(KEY, 1, 'POST'), KEY, store)).status).toBe(405);
    expect((await handlePhotoUpload(upload(KEY, MAX_PHOTO_BYTES + 1), KEY, store)).status).toBe(
      413,
    );
    expect(store.puts).toEqual([]);
  });
});
