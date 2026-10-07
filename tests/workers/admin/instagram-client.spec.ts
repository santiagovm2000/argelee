import { describe, expect, it } from 'vitest';
import {
  graphInstagramClient,
  InstagramError,
  refreshedToken,
} from '@workers/admin/instagram-client';

const TOKEN = 'long-lived-token';
const API = 'https://graph.instagram.com/v25.0';

interface Call {
  readonly url: string;
  readonly method: string;
  readonly authorization: string | null;
  readonly body: unknown;
}

/** A network that records each request and answers with the replies given, in order. */
function network(...replies: { status?: number; body: unknown }[]) {
  const calls: Call[] = [];
  const send = (input: string, init: RequestInit = {}): Promise<Response> => {
    const reply = replies[calls.length] ?? { body: {} };
    calls.push({
      url: input,
      method: init.method ?? 'GET',
      authorization: new Headers(init.headers).get('Authorization'),
      body: typeof init.body === 'string' ? (JSON.parse(init.body) as unknown) : null,
    });
    return Promise.resolve(Response.json(reply.body, { status: reply.status ?? 200 }));
  };
  return { calls, send };
}

describe('graphInstagramClient', () => {
  it('reads the account with the token in a header, never in the address', async () => {
    const { calls, send } = network({ body: { user_id: '1784', username: 'arg_eles' } });
    const account = await graphInstagramClient(TOKEN, send).account();
    expect(account).toEqual({ id: '1784', username: 'arg_eles' });
    expect(calls[0]?.url).toBe(`${API}/me?fields=user_id%2Cusername`);
    expect(calls[0]?.authorization).toBe(`Bearer ${TOKEN}`);
    expect(calls[0]?.url).not.toContain(TOKEN);
  });

  it('builds a carousel from image containers and publishes it', async () => {
    const { calls, send } = network(
      { body: { id: 'image-1' } },
      { body: { id: 'carousel-1' } },
      { body: { status_code: 'FINISHED' } },
      { body: { id: 'media-1' } },
    );
    const client = graphInstagramClient(TOKEN, send);
    expect(await client.imageContainer('1784', 'https://admin.argelees.com/posts/a.jpg')).toBe(
      'image-1',
    );
    expect(await client.carouselContainer('1784', ['image-1', 'image-2'], 'Texto')).toBe(
      'carousel-1',
    );
    expect(await client.containerStatus('carousel-1')).toEqual({ state: 'FINISHED', detail: null });
    expect(await client.publish('1784', 'carousel-1')).toBe('media-1');

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      `POST ${API}/1784/media`,
      `POST ${API}/1784/media`,
      `GET ${API}/carousel-1?fields=status_code%2Cstatus`,
      `POST ${API}/1784/media_publish`,
    ]);
    expect(calls[0]?.body).toEqual({
      image_url: 'https://admin.argelees.com/posts/a.jpg',
      is_carousel_item: true,
    });
    expect(calls[1]?.body).toEqual({
      media_type: 'CAROUSEL',
      children: 'image-1,image-2',
      caption: 'Texto',
    });
    expect(calls[3]?.body).toEqual({ creation_id: 'carousel-1' });
  });

  it('turns a refusal into the explanation Instagram wrote for people', async () => {
    const { send } = network(
      {
        status: 400,
        body: { error: { message: 'Invalid parameter', error_user_msg: 'La imagen no sirve.' } },
      },
      { status: 500, body: 'not json at all' },
      { body: {} },
    );
    const client = graphInstagramClient(TOKEN, send);
    await expect(client.imageContainer('1784', 'https://x/a.jpg')).rejects.toThrow(
      new InstagramError('La imagen no sirve.'),
    );
    await expect(client.account()).rejects.toThrow('instagram answered 500');
    await expect(client.publish('1784', 'carousel-1')).rejects.toThrow('instagram left out id');
  });
});

describe('refreshedToken', () => {
  it('trades the token at the refresh endpoint and returns the new one', async () => {
    const { calls, send } = network({
      body: { access_token: 'fresh-token', token_type: 'bearer', expires_in: 5_183_944 },
    });
    expect(await refreshedToken(TOKEN, send)).toBe('fresh-token');
    expect(calls[0]?.url).toBe(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${TOKEN}`,
    );
  });

  it('fails with an explanation that does not carry the token', async () => {
    const { send } = network({ status: 400, body: { error: { message: 'Token too young' } } });
    const failure = await refreshedToken(TOKEN, send).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(InstagramError);
    expect((failure as Error).message).toBe('Token too young');
    expect((failure as Error).message).not.toContain(TOKEN);
  });
});
