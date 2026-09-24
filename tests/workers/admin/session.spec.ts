import { describe, expect, it } from 'vitest';
import { SESSION_COOKIE, SESSION_TTL_MS } from '@workers/admin/auth.constants';
import {
  clearedSessionCookie,
  constantTimeEqual,
  hashPassword,
  issueSession,
  randomSecret,
  readCookie,
  sameName,
  sessionCookie,
  verifyPassword,
  verifySession,
} from '@workers/admin/session';

const SECRET = 'test-secret';
const NOW = Date.UTC(2026, 8, 22, 12, 0, 0);

describe('password hashing', () => {
  it('verifies the password it hashed and nothing else', async () => {
    const stored = await hashPassword('correct horse battery staple');
    expect(stored.startsWith('pbkdf2-sha256$')).toBe(true);
    expect(stored).not.toContain('correct horse');
    expect(await verifyPassword('correct horse battery staple', stored)).toBe(true);
    expect(await verifyPassword('correct horse battery stapl', stored)).toBe(false);
  });

  it('salts every hash, so equal passwords never share a digest', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('never verifies a malformed record', async () => {
    expect(await verifyPassword('x', '')).toBe(false);
    expect(await verifyPassword('x', 'md5$1$a$b')).toBe(false);
    expect(await verifyPassword('x', 'pbkdf2-sha256$notanumber$a$b')).toBe(false);
  });
});

describe('constantTimeEqual and sameName', () => {
  it('compares bytes and names for equality', async () => {
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true);
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(false);
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 0]))).toBe(false);
    expect(await sameName('owner', 'owner')).toBe(true);
    expect(await sameName('owner', 'Owner')).toBe(false);
  });
});

describe('sessions', () => {
  it('issues a token that verifies until it expires', async () => {
    const token = await issueSession(SECRET, NOW);
    const session = await verifySession(SECRET, token, NOW + 1);
    expect(session?.expiresAt).toBe(NOW + SESSION_TTL_MS);
    expect(await verifySession(SECRET, token, NOW + SESSION_TTL_MS)).toBeNull();
  });

  it('rejects a token signed with another secret or altered in transit', async () => {
    const token = await issueSession(SECRET, NOW);
    expect(await verifySession('other', token, NOW)).toBeNull();
    const [expiry, signature] = token.split('.');
    expect(
      await verifySession(SECRET, `${String(Number(expiry) + 1000)}.${signature}`, NOW),
    ).toBeNull();
    expect(await verifySession(SECRET, 'garbage', NOW)).toBeNull();
    expect(await verifySession(SECRET, null, NOW)).toBeNull();
  });

  it('writes and reads the cookie', async () => {
    const token = await issueSession(SECRET, NOW);
    const header = sessionCookie(token, NOW + SESSION_TTL_MS, NOW);
    expect(header).toContain(`${SESSION_COOKIE}=${token}`);
    expect(header).toContain('HttpOnly');
    expect(header).toContain('Secure');
    expect(header).toContain('SameSite=Strict');
    expect(readCookie(`other=1; ${SESSION_COOKIE}=${token}`, SESSION_COOKIE)).toBe(token);
    expect(readCookie('other=1', SESSION_COOKIE)).toBeNull();
    expect(clearedSessionCookie()).toContain('Max-Age=0');
  });

  it('makes secrets of the asked length that never repeat', () => {
    expect(randomSecret(32)).not.toBe(randomSecret(32));
    expect(randomSecret(32).length).toBeGreaterThan(40);
  });
});
