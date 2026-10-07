import { describe, expect, it } from 'vitest';
import {
  handleInstagramStatus,
  handlePublish,
  handleSlide,
  handleSlideUpload,
  type PublishContext,
  readPublishRequest,
  sweepSlides,
} from '@workers/admin/instagram-api';
import {
  type ContainerStatus,
  type InstagramClient,
  InstagramError,
} from '@workers/admin/instagram-client';
import { MAX_SLIDE_BYTES, STALE_SLIDE_MS } from '@workers/admin/instagram.constants';
import type { PublishProblem } from '@workers/shared/instagram.model';
import type { ObjectRemover } from '@workers/shared/stores';

const ORIGIN = 'https://admin.argelees.com';
const FIRST = '11111111-1111-4111-8111-111111111111.jpg';
const SECOND = '22222222-2222-4222-8222-222222222222.jpg';
const NOW = Date.UTC(2026, 9, 6, 12, 0, 0);

interface Parked {
  readonly contentType: string;
  readonly storedAt: number;
}

function bucket(parked: Readonly<Record<string, number>> = {}) {
  const objects = new Map<string, Parked>(
    Object.entries(parked).map(([key, storedAt]) => [key, { contentType: 'image/jpeg', storedAt }]),
  );
  const store: ObjectRemover = {
    get(key) {
      const object = objects.get(key);
      if (object === undefined) return Promise.resolve(null);
      return Promise.resolve({
        body: new Response('jpeg').body ?? new ReadableStream(),
        contentType: object.contentType,
        etag: '"etag"',
      });
    },
    put(key, _body, contentType) {
      objects.set(key, { contentType, storedAt: NOW });
      return Promise.resolve();
    },
    storedBefore(prefix, time) {
      return Promise.resolve(
        [...objects]
          .filter(([key, object]) => key.startsWith(prefix) && object.storedAt < time)
          .map(([key]) => key),
      );
    },
    remove(keys) {
      for (const key of keys) objects.delete(key);
      return Promise.resolve();
    },
  };
  return { objects, store };
}

interface Script {
  readonly states?: readonly ContainerStatus[];
  readonly failAt?: keyof InstagramClient;
}

/** An Instagram that records what it was asked and can be told where to refuse. */
function instagram(script: Script = {}) {
  const asked: string[] = [];
  const states = [...(script.states ?? [{ state: 'FINISHED', detail: null }])];
  const step = <Value>(name: keyof InstagramClient, note: string, value: Value): Promise<Value> => {
    asked.push(note);
    return script.failAt === name
      ? Promise.reject(new InstagramError(`refused ${name}`))
      : Promise.resolve(value);
  };
  const client: InstagramClient = {
    account: () => step('account', 'account', { id: '1784', username: 'arg_eles' }),
    imageContainer: (_account, url) => step('imageContainer', `image ${url}`, `c:${url}`),
    carouselContainer: (_account, children, caption) =>
      step('carouselContainer', `carousel ${children.join('+')} | ${caption}`, 'carousel-1'),
    containerStatus: () =>
      step('containerStatus', 'status', states.shift() ?? { state: 'IN_PROGRESS', detail: null }),
    publish: (_account, container) => step('publish', `publish ${container}`, 'media-1'),
  };
  return { asked, client };
}

function publishRequest(body: unknown, method = 'POST'): Request {
  return new Request(`${ORIGIN}/api/instagram/publish`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(body) : null,
  });
}

function context(
  client: InstagramClient | null,
  slides: ObjectRemover,
): PublishContext & { readonly waits: number[] } {
  const waits: number[] = [];
  return {
    client,
    slides,
    origin: ORIGIN,
    waits,
    wait(ms) {
      waits.push(ms);
      return Promise.resolve();
    },
  };
}

const ORDER = { slides: [FIRST, SECOND], caption: 'Encapsulada de frutas' };
const PARKED = { [`posts/${FIRST}`]: NOW, [`posts/${SECOND}`]: NOW };

describe('handleInstagramStatus', () => {
  it('names the account when the token works', async () => {
    const response = await handleInstagramStatus(instagram().client);
    expect(await response.json()).toEqual({ state: 'ready', username: 'arg_eles' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('tells a missing token from one Instagram does not accept', async () => {
    expect(await (await handleInstagramStatus(null)).json()).toEqual({
      state: 'unconfigured',
      username: null,
    });
    const refused = await handleInstagramStatus(instagram({ failAt: 'account' }).client);
    expect(await refused.json()).toEqual({ state: 'unreachable', username: null });
  });
});

describe('handleSlideUpload', () => {
  function upload(name: string, size = 1, method = 'PUT'): Request {
    return new Request(`${ORIGIN}/api/instagram/slides/${name}`, {
      method,
      headers: { 'Content-Length': String(size) },
      body: method === 'PUT' ? new Uint8Array(1) : null,
    });
  }

  it('parks a slide as a JPEG under the prefix of its own', async () => {
    const { objects, store } = bucket();
    const response = await handleSlideUpload(upload(FIRST), FIRST, store);
    expect(response.status).toBe(201);
    expect(objects.get(`posts/${FIRST}`)?.contentType).toBe('image/jpeg');
  });

  it('refuses a name that is not a random id, a wrong method and a slide past the limit', async () => {
    const { objects, store } = bucket();
    const escaping = '../photos/a.jpg';
    expect((await handleSlideUpload(upload('x.jpg'), escaping, store)).status).toBe(400);
    expect((await handleSlideUpload(upload(FIRST, 1, 'POST'), FIRST, store)).status).toBe(405);
    expect((await handleSlideUpload(upload(FIRST, MAX_SLIDE_BYTES + 1), FIRST, store)).status).toBe(
      413,
    );
    expect(objects.size).toBe(0);
  });
});

describe('handleSlide', () => {
  const read = (key: string, method = 'GET'): Request =>
    new Request(`${ORIGIN}/${key}`, { method });

  it('serves a parked slide without letting anyone keep a copy', async () => {
    const { store } = bucket(PARKED);
    const response = await handleSlide(read(`posts/${FIRST}`), `posts/${FIRST}`, store);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('answers 404 for a slide that is gone or a key that is not a slide', async () => {
    const { store } = bucket(PARKED);
    expect((await handleSlide(read(`posts/${SECOND}`), 'posts/nope.jpg', store)).status).toBe(404);
    const missing = `posts/${FIRST.replace('1', '3')}`;
    expect((await handleSlide(read(missing), missing, store)).status).toBe(404);
    expect(
      (await handleSlide(read(`posts/${FIRST}`, 'POST'), `posts/${FIRST}`, store)).status,
    ).toBe(405);
  });
});

describe('readPublishRequest', () => {
  it('takes two to ten distinct slides and a caption Instagram accepts', () => {
    expect(readPublishRequest(ORDER)).toEqual(ORDER);
    expect(readPublishRequest({ slides: [FIRST], caption: '' })).toBeNull();
    expect(readPublishRequest({ slides: [FIRST, FIRST], caption: '' })).toBeNull();
    expect(readPublishRequest({ slides: [FIRST, 'photos/a.jpg'], caption: '' })).toBeNull();
    expect(readPublishRequest({ slides: [FIRST, SECOND], caption: 'x'.repeat(2201) })).toBeNull();
    expect(readPublishRequest({ slides: [FIRST, SECOND] })).toBeNull();
    expect(readPublishRequest(null)).toBeNull();
  });
});

describe('handlePublish', () => {
  it('posts the slides in order as one carousel and removes them', async () => {
    const { objects, store } = bucket(PARKED);
    const { asked, client } = instagram();
    const response = await handlePublish(publishRequest(ORDER), context(client, store));
    expect(response.status).toBe(204);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(asked).toEqual([
      'account',
      `image ${ORIGIN}/posts/${FIRST}`,
      `image ${ORIGIN}/posts/${SECOND}`,
      `carousel c:${ORIGIN}/posts/${FIRST}+c:${ORIGIN}/posts/${SECOND} | Encapsulada de frutas`,
      'status',
      'publish carousel-1',
    ]);
    expect(objects.size).toBe(0);
  });

  it('waits while Instagram builds the carousel and gives up after the last look', async () => {
    const building = { state: 'IN_PROGRESS', detail: null };
    const patient = context(
      instagram({ states: [building, building, { state: 'FINISHED', detail: null }] }).client,
      bucket(PARKED).store,
    );
    expect((await handlePublish(publishRequest(ORDER), patient)).status).toBe(204);
    expect(patient.waits).toHaveLength(2);

    const { objects, store } = bucket(PARKED);
    const { asked, client } = instagram({ states: [] });
    const response = await handlePublish(publishRequest(ORDER), context(client, store));
    expect(response.status).toBe(504);
    expect(((await response.json()) as PublishProblem).error).toBe('instagram-slow');
    expect(asked).not.toContain('publish carousel-1');
    expect(objects.size).toBe(0);
  });

  it('reports what Instagram said when it refuses before publishing', async () => {
    const { objects, store } = bucket(PARKED);
    const refusing = instagram({ failAt: 'imageContainer' });
    const response = await handlePublish(publishRequest(ORDER), context(refusing.client, store));
    expect(response.status).toBe(502);
    expect((await response.json()) as PublishProblem).toEqual({
      error: 'instagram-rejected',
      detail: 'refused imageContainer',
    });
    expect(objects.size).toBe(0);

    const failed = instagram({ states: [{ state: 'ERROR', detail: 'Media download failed' }] });
    const broken = await handlePublish(
      publishRequest(ORDER),
      context(failed.client, bucket(PARKED).store),
    );
    expect((await broken.json()) as PublishProblem).toEqual({
      error: 'instagram-rejected',
      detail: 'Media download failed',
    });
  });

  it('says the outcome is uncertain when the failure comes after asking to publish', async () => {
    const { objects, store } = bucket(PARKED);
    const response = await handlePublish(
      publishRequest(ORDER),
      context(instagram({ failAt: 'publish' }).client, store),
    );
    expect(response.status).toBe(502);
    expect(((await response.json()) as PublishProblem).error).toBe('instagram-uncertain');
    expect(objects.size).toBe(0);
  });

  it('refuses without a token, a bad body or a wrong method, and never leaves slides behind', async () => {
    const { objects, store } = bucket(PARKED);
    const unconfigured = await handlePublish(publishRequest(ORDER), context(null, store));
    expect(unconfigured.status).toBe(503);
    expect(objects.size).toBe(0);

    const { asked, client } = instagram();
    const idle = context(client, bucket().store);
    expect((await handlePublish(publishRequest({ slides: [FIRST] }), idle)).status).toBe(400);
    expect((await handlePublish(publishRequest(null, 'GET'), idle)).status).toBe(405);
    expect(asked).toEqual([]);
  });
});

describe('sweepSlides', () => {
  it('removes only slides old enough to have been left behind', async () => {
    const stale = `posts/${FIRST}`;
    const fresh = `posts/${SECOND}`;
    const photo = `photos/${'a'.repeat(64)}.jpg`;
    const { objects, store } = bucket({
      [stale]: NOW - STALE_SLIDE_MS - 1,
      [fresh]: NOW - 1,
      [photo]: 0,
    });
    expect(await sweepSlides(store, NOW)).toBe(1);
    expect([...objects.keys()]).toEqual([fresh, photo]);
  });
});
