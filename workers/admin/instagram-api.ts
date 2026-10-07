import {
  CACHE_CONTROL,
  CONTENT_TYPE,
  HEADER,
  HTTP_STATUS,
  READ_METHODS,
} from '../shared/http.constants';
import { json, methodNotAllowed, readJson } from '../shared/http';
import {
  CAPTION_MAX_LENGTH,
  CAROUSEL_SLIDES,
  SLIDE_MIME_TYPE,
} from '../shared/instagram.constants';
import type {
  InstagramStatus,
  PublishFailure,
  PublishProblem,
  PublishRequest,
} from '../shared/instagram.model';
import type { ObjectRemover, ObjectStore, ObjectWriter } from '../shared/stores';
import { InstagramError, type InstagramClient } from './instagram-client';
import {
  CONTAINER_POLL,
  CONTAINER_STATE,
  MAX_SLIDE_BYTES,
  SLIDE_KEY_PREFIX,
  SLIDE_NAME_PATTERN,
  STALE_SLIDE_MS,
} from './instagram.constants';

const UPLOAD_METHODS: readonly string[] = ['PUT'];
const PUBLISH_METHODS: readonly string[] = ['POST'];
const PRIVATE = { [HEADER.cacheControl]: CACHE_CONTROL.private };

/** What a publication needs from outside: Instagram, the parked slides, where they are public, and a clock to wait on. */
export interface PublishContext {
  readonly client: InstagramClient | null;
  readonly slides: ObjectRemover;
  readonly origin: string;
  readonly wait: (ms: number) => Promise<void>;
}

/** GET /api/instagram: whether a token is set and which account answers for it. */
export async function handleInstagramStatus(client: InstagramClient | null): Promise<Response> {
  let status: InstagramStatus = { state: 'unconfigured', username: null };
  if (client !== null) {
    try {
      status = { state: 'ready', username: (await client.account()).username };
    } catch {
      status = { state: 'unreachable', username: null };
    }
  }
  return json(status, { headers: PRIVATE });
}

/** PUT /api/instagram/slides/<uuid>.jpg: parks one slide where Instagram can fetch it. */
export async function handleSlideUpload(
  request: Request,
  name: string,
  store: ObjectWriter,
): Promise<Response> {
  if (request.method !== 'PUT') return methodNotAllowed(UPLOAD_METHODS);
  if (!SLIDE_NAME_PATTERN.test(name)) {
    return json({ error: 'bad-slide-name' }, { status: HTTP_STATUS.badRequest });
  }
  const size = Number(request.headers.get('Content-Length') ?? '0');
  if (size > MAX_SLIDE_BYTES) {
    return json({ error: 'slide-too-large' }, { status: HTTP_STATUS.payloadTooLarge });
  }
  if (request.body === null) {
    return json({ error: 'bad-request' }, { status: HTTP_STATUS.badRequest });
  }
  await store.put(`${SLIDE_KEY_PREFIX}${name}`, request.body, SLIDE_MIME_TYPE);
  return json({ name }, { status: HTTP_STATUS.created, headers: PRIVATE });
}

/** GET /posts/<uuid>.jpg: a parked slide, public for the moments Instagram needs to read it. */
export async function handleSlide(
  request: Request,
  key: string,
  store: ObjectStore,
): Promise<Response> {
  if (!READ_METHODS.includes(request.method)) return methodNotAllowed(READ_METHODS);
  if (!SLIDE_NAME_PATTERN.test(key.slice(SLIDE_KEY_PREFIX.length))) {
    return new Response(null, { status: HTTP_STATUS.notFound });
  }
  const object = await store.get(key);
  if (object === null) return new Response(null, { status: HTTP_STATUS.notFound });
  return new Response(request.method === 'HEAD' ? null : object.body, {
    headers: { [HEADER.contentType]: object.contentType ?? CONTENT_TYPE.binary, ...PRIVATE },
  });
}

/** The publication a request body asks for, or null when it is not one Instagram would take. */
export function readPublishRequest(body: unknown): PublishRequest | null {
  if (typeof body !== 'object' || body === null) return null;
  const { slides, caption } = body as { slides?: unknown; caption?: unknown };
  if (typeof caption !== 'string' || caption.length > CAPTION_MAX_LENGTH) return null;
  if (!Array.isArray(slides)) return null;
  const names = slides.filter(
    (slide): slide is string => typeof slide === 'string' && SLIDE_NAME_PATTERN.test(slide),
  );
  const complete = names.length === slides.length && new Set(names).size === names.length;
  const fits = names.length >= CAROUSEL_SLIDES.min && names.length <= CAROUSEL_SLIDES.max;
  return complete && fits ? { slides: names, caption } : null;
}

function problem(error: PublishFailure, status: number, detail: string | null = null): Response {
  const body: PublishProblem = { error, detail };
  return json(body, { status, headers: PRIVATE });
}

/** Waits for Instagram to finish building a container; false when it is still at it after the last look. */
async function settled(
  client: InstagramClient,
  containerId: string,
  wait: (ms: number) => Promise<void>,
): Promise<boolean> {
  for (let attempt = 0; attempt < CONTAINER_POLL.attempts; attempt += 1) {
    const status = await client.containerStatus(containerId);
    if (status.state === CONTAINER_STATE.ready) return true;
    if (status.state !== CONTAINER_STATE.pending) {
      throw new InstagramError(status.detail ?? status.state);
    }
    await wait(CONTAINER_POLL.intervalMs);
  }
  return false;
}

/**
 * POST /api/instagram/publish: posts the parked slides as one carousel and
 * removes them whatever happens. A failure after the post was requested is
 * reported apart, because the post may be live and a retry would duplicate it.
 */
export async function handlePublish(request: Request, context: PublishContext): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(PUBLISH_METHODS);
  const order = readPublishRequest(await readJson(request));
  if (order === null) return problem('bad-request', HTTP_STATUS.badRequest);

  const { client, slides, origin, wait } = context;
  const keys = order.slides.map((name) => `${SLIDE_KEY_PREFIX}${name}`);
  let requested = false;
  try {
    if (client === null) return problem('instagram-unconfigured', HTTP_STATUS.serviceUnavailable);
    const account = await client.account();
    const children = await Promise.all(
      keys.map((key) => client.imageContainer(account.id, `${origin}/${key}`)),
    );
    const carousel = await client.carouselContainer(account.id, children, order.caption);
    if (!(await settled(client, carousel, wait))) {
      return problem('instagram-slow', HTTP_STATUS.gatewayTimeout);
    }
    requested = true;
    await client.publish(account.id, carousel);
    return new Response(null, { status: HTTP_STATUS.noContent, headers: PRIVATE });
  } catch (error) {
    return problem(
      requested ? 'instagram-uncertain' : 'instagram-rejected',
      HTTP_STATUS.badGateway,
      error instanceof InstagramError ? error.message : null,
    );
  } finally {
    await slides.remove(keys).catch(() => undefined);
  }
}

/** Removes slides a publication left behind: the safety net under the removal each request does. */
export async function sweepSlides(
  slides: ObjectRemover,
  now: number = Date.now(),
): Promise<number> {
  const stale = await slides.storedBefore(SLIDE_KEY_PREFIX, now - STALE_SLIDE_MS);
  await slides.remove(stale);
  return stale.length;
}
