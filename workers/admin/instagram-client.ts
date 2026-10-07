import {
  INSTAGRAM_API,
  INSTAGRAM_API_VERSION,
  TOKEN_REFRESH_GRANT,
  TOKEN_REFRESH_PATH,
} from './instagram.constants';

export interface InstagramAccount {
  readonly id: string;
  readonly username: string;
}

export interface ContainerStatus {
  readonly state: string;
  readonly detail: string | null;
}

/** Instagram said no; the message is its own explanation and never carries the token. */
export class InstagramError extends Error {}

/** The calls a publication is made of; Instagram in production, a fake in tests. */
export interface InstagramClient {
  account(): Promise<InstagramAccount>;
  /** One image of a carousel, fetched by Instagram from a public URL. */
  imageContainer(accountId: string, imageUrl: string): Promise<string>;
  carouselContainer(
    accountId: string,
    children: readonly string[],
    caption: string,
  ): Promise<string>;
  containerStatus(containerId: string): Promise<ContainerStatus>;
  /** Makes the container a post and returns the post's id. */
  publish(accountId: string, containerId: string): Promise<string>;
}

type Reply = Readonly<Record<string, unknown>>;
type Send = (input: string, init?: RequestInit) => Promise<Response>;

const overTheNetwork: Send = (input, init) => fetch(input, init);

function textOf(reply: Reply, field: string): string | null {
  const value = reply[field];
  return typeof value === 'string' && value !== '' ? value : null;
}

/** The explanation inside an error reply, preferring the one Instagram wrote for people. */
function refusalIn(reply: Reply): string | null {
  const error = reply['error'];
  if (typeof error !== 'object' || error === null) return null;
  const fields = error as Reply;
  return textOf(fields, 'error_user_msg') ?? textOf(fields, 'message');
}

async function replyOf(response: Response): Promise<Reply> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  const reply: Reply = typeof body === 'object' && body !== null ? (body as Reply) : {};
  if (!response.ok) {
    throw new InstagramError(refusalIn(reply) ?? `instagram answered ${String(response.status)}`);
  }
  return reply;
}

function required(reply: Reply, field: string): string {
  const value = textOf(reply, field);
  if (value === null) throw new InstagramError(`instagram left out ${field}`);
  return value;
}

/** The Instagram API with Instagram Login, authenticated with a long-lived token. */
export function graphInstagramClient(token: string, send: Send = overTheNetwork): InstagramClient {
  const authorization = { Authorization: `Bearer ${token}` };
  const endpoint = (path: string): URL =>
    new URL(`${INSTAGRAM_API}/${INSTAGRAM_API_VERSION}/${path}`);

  async function read(path: string, fields: string): Promise<Reply> {
    const url = endpoint(path);
    url.searchParams.set('fields', fields);
    return replyOf(await send(url.href, { headers: authorization }));
  }

  async function create(path: string, body: Reply): Promise<string> {
    const response = await send(endpoint(path).href, {
      method: 'POST',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return required(await replyOf(response), 'id');
  }

  return {
    async account() {
      const reply = await read('me', 'user_id,username');
      return { id: required(reply, 'user_id'), username: required(reply, 'username') };
    },
    imageContainer: (accountId, imageUrl) =>
      create(`${accountId}/media`, { image_url: imageUrl, is_carousel_item: true }),
    carouselContainer: (accountId, children, caption) =>
      create(`${accountId}/media`, {
        media_type: 'CAROUSEL',
        children: children.join(','),
        caption,
      }),
    async containerStatus(containerId) {
      const reply = await read(containerId, 'status_code,status');
      return { state: required(reply, 'status_code'), detail: textOf(reply, 'status') };
    },
    publish: (accountId, containerId) =>
      create(`${accountId}/media_publish`, { creation_id: containerId }),
  };
}

/** Trades a long-lived token for a new one, good for another sixty days. */
export async function refreshedToken(token: string, send: Send = overTheNetwork): Promise<string> {
  const url = new URL(`${INSTAGRAM_API}/${TOKEN_REFRESH_PATH}`);
  url.searchParams.set('grant_type', TOKEN_REFRESH_GRANT);
  url.searchParams.set('access_token', token);
  return required(await replyOf(await send(url.href)), 'access_token');
}
