import { beforeAll, describe, expect, it } from 'vitest';
import {
  type Credentials,
  handleLogin,
  handleLogout,
  handleMe,
  type LoginLimiter,
  OPEN_LIMITER,
  requireCsrfHeader,
  requireSession,
} from '@workers/admin/auth';
import { SESSION_COOKIE } from '@workers/admin/auth.constants';
import { CSRF_HEADER_VALUE } from '@workers/shared/admin-api.constants';
import { hashPassword, issueSession } from '@workers/admin/session';

const LOGIN_URL = 'https://admin.argelees.com/api/login';
const USER = 'owner';
const PASSWORD = 'a long enough password';
const NOW = Date.UTC(2026, 8, 22, 12, 0, 0);

let credentials: Credentials;

beforeAll(async () => {
  credentials = {
    user: USER,
    passwordHash: await hashPassword(PASSWORD),
    sessionSecret: 'session-secret',
  };
});

function login(body: unknown, ip = '203.0.113.7'): Request {
  return new Request(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
    body: JSON.stringify(body),
  });
}

function withCookie(token: string): Request {
  return new Request('https://admin.argelees.com/api/me', {
    headers: { Cookie: `${SESSION_COOKIE}=${token}` },
  });
}

describe('handleLogin', () => {
  it('signs the owner in and sets the session cookie', async () => {
    const response = await handleLogin(
      login({ user: USER, password: PASSWORD }),
      credentials,
      OPEN_LIMITER,
      NOW,
    );
    expect(response.status).toBe(200);
    const cookie = response.headers.get('Set-Cookie') ?? '';
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toContain('HttpOnly');
    const body = (await response.json()) as { user: string; expiresAt: number };
    expect(body.user).toBe(USER);
    expect(body.expiresAt).toBeGreaterThan(NOW);
  });

  it('refuses a wrong password, a wrong user and a malformed body alike', async () => {
    const wrongPassword = await handleLogin(
      login({ user: USER, password: 'nope' }),
      credentials,
      OPEN_LIMITER,
      NOW,
    );
    const wrongUser = await handleLogin(
      login({ user: 'someone', password: PASSWORD }),
      credentials,
      OPEN_LIMITER,
      NOW,
    );
    expect(wrongPassword.status).toBe(401);
    expect(wrongUser.status).toBe(401);
    expect(wrongPassword.headers.get('Set-Cookie')).toBeNull();
    const malformed = await handleLogin(login({ user: 1 }), credentials, OPEN_LIMITER, NOW);
    expect(malformed.status).toBe(400);
  });

  it('answers 429 once the limiter says no, keyed by client address', async () => {
    const seen: string[] = [];
    const limiter: LoginLimiter = {
      allow: (key) => {
        seen.push(key);
        return Promise.resolve(false);
      },
    };
    const response = await handleLogin(
      login({ user: USER, password: PASSWORD }, '198.51.100.2'),
      credentials,
      limiter,
      NOW,
    );
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(seen).toEqual(['198.51.100.2']);
  });
});

describe('sessions on requests', () => {
  it('lets a valid cookie through and reports who is in', async () => {
    const token = await issueSession(credentials.sessionSecret, NOW);
    expect(await requireSession(withCookie(token), credentials, NOW)).toBeNull();
    const me = await handleMe(withCookie(token), credentials, NOW);
    expect(me.status).toBe(200);
    expect(((await me.json()) as { user: string }).user).toBe(USER);
  });

  it('turns away a missing, forged or expired cookie', async () => {
    const token = await issueSession(credentials.sessionSecret, NOW);
    const noCookie = new Request('https://admin.argelees.com/api/me');
    expect((await requireSession(noCookie, credentials, NOW))?.status).toBe(401);
    expect((await requireSession(withCookie('1.forged'), credentials, NOW))?.status).toBe(401);
    const later = NOW + 31 * 24 * 60 * 60 * 1000;
    expect((await requireSession(withCookie(token), credentials, later))?.status).toBe(401);
  });

  it('clears the cookie on logout', () => {
    const response = handleLogout();
    expect(response.status).toBe(204);
    expect(response.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });
});

describe('requireCsrfHeader', () => {
  it('accepts the panel header and refuses its absence', () => {
    const withHeader = new Request(LOGIN_URL, {
      method: 'PUT',
      headers: { 'X-Requested-With': CSRF_HEADER_VALUE },
    });
    expect(requireCsrfHeader(withHeader)).toBeNull();
    expect(requireCsrfHeader(new Request(LOGIN_URL, { method: 'PUT' }))?.status).toBe(403);
  });
});
