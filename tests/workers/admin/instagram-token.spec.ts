import { describe, expect, it } from 'vitest';
import { currentToken, openToken, renewToken, sealToken } from '@workers/admin/instagram-token';
import type { TextSlot } from '@workers/shared/stores';

const SECRET = 'the-token-the-owner-set';
const RENEWED = 'the-token-instagram-gave-back';

function slot(initial: string | null = null): TextSlot & { value: string | null } {
  const fake = {
    value: initial,
    read: () => Promise.resolve(fake.value),
    write(value: string) {
      fake.value = value;
      return Promise.resolve();
    },
  };
  return fake;
}

describe('sealToken', () => {
  it('opens only with the secret that sealed it, and never rests as plain text', async () => {
    const seal = await sealToken(SECRET, RENEWED);
    expect(seal).not.toContain(RENEWED);
    expect(await openToken(SECRET, seal)).toBe(RENEWED);
    expect(await openToken('another-secret', seal)).toBeNull();
  });

  it('seals the same token differently each time and rejects a damaged seal', async () => {
    const [first, second] = await Promise.all([
      sealToken(SECRET, RENEWED),
      sealToken(SECRET, RENEWED),
    ]);
    expect(first).not.toBe(second);
    expect(await openToken(SECRET, `${first}x`)).toBeNull();
    expect(await openToken(SECRET, 'not-a-seal')).toBeNull();
  });
});

describe('currentToken', () => {
  it('is the secret until a renewal exists, then the renewal', async () => {
    const store = slot();
    expect(await currentToken(SECRET, store)).toBe(SECRET);
    store.value = await sealToken(SECRET, RENEWED);
    expect(await currentToken(SECRET, store)).toBe(RENEWED);
  });

  it('goes back to the secret when the owner has replaced it', async () => {
    const store = slot(await sealToken(SECRET, RENEWED));
    expect(await currentToken('a-new-secret', store)).toBe('a-new-secret');
  });
});

describe('renewToken', () => {
  it('trades the token in use and keeps the new one sealed', async () => {
    const store = slot();
    const traded: string[] = [];
    const renewed = await renewToken(SECRET, store, (token) => {
      traded.push(token);
      return Promise.resolve(RENEWED);
    });
    expect(renewed).toBe(true);
    expect(traded).toEqual([SECRET]);
    expect(store.value).not.toContain(RENEWED);
    expect(await currentToken(SECRET, store)).toBe(RENEWED);
  });

  it('leaves everything as it was when Instagram refuses', async () => {
    const seal = await sealToken(SECRET, RENEWED);
    const store = slot(seal);
    const renewed = await renewToken(SECRET, store, () => Promise.reject(new Error('too young')));
    expect(renewed).toBe(false);
    expect(store.value).toBe(seal);
  });
});
