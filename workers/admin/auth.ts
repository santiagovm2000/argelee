import { CACHE_CONTROL, HEADER, HTTP_STATUS } from '../shared/http.constants';
import { json, readJson } from '../shared/http';
import { CSRF_HEADER_VALUE } from '../shared/admin-api.constants';
import { LOGIN_RETRY_AFTER_SECONDS, SESSION_COOKIE } from './auth.constants';
import {
  clearedSessionCookie,
  issueSession,
  readCookie,
  sameName,
  sessionCookie,
  verifyPassword,
  verifySession,
} from './session';

export interface Credentials {
  readonly user: string;
  readonly passwordHash: string;
  readonly sessionSecret: string;
}

/** Rate limit for login attempts, keyed by client. */
export interface LoginLimiter {
  allow(key: string): Promise<boolean>;
}

const UNKNOWN_CLIENT = 'unknown';

function unauthorized(): Response {
  return json({ error: 'unauthorized' }, { status: HTTP_STATUS.unauthorized });
}

/** POST /api/login: verifies the credentials and sets the session cookie. */
export async function handleLogin(
  request: Request,
  credentials: Credentials,
  limiter: LoginLimiter,
  now: number = Date.now(),
): Promise<Response> {
  const client = request.headers.get(HEADER.clientIp) ?? UNKNOWN_CLIENT;
  if (!(await limiter.allow(client))) {
    return json(
      { error: 'too-many-attempts' },
      {
        status: HTTP_STATUS.tooManyRequests,
        headers: { [HEADER.retryAfter]: String(LOGIN_RETRY_AFTER_SECONDS) },
      },
    );
  }

  const body = await readJson(request);
  const fields: Record<string, unknown> =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const user = fields['user'];
  const password = fields['password'];
  if (typeof user !== 'string' || typeof password !== 'string') {
    return json({ error: 'bad-request' }, { status: HTTP_STATUS.badRequest });
  }

  // Both checks run so a wrong name costs the same as a wrong password.
  const [userMatches, passwordMatches] = await Promise.all([
    sameName(user, credentials.user),
    verifyPassword(password, credentials.passwordHash),
  ]);
  if (!userMatches || !passwordMatches) return unauthorized();

  const token = await issueSession(credentials.sessionSecret, now);
  const session = await verifySession(credentials.sessionSecret, token, now);
  if (session === null) return unauthorized();
  return json(
    { user: credentials.user, expiresAt: session.expiresAt },
    {
      headers: {
        [HEADER.setCookie]: sessionCookie(token, session.expiresAt, now),
        [HEADER.cacheControl]: CACHE_CONTROL.private,
      },
    },
  );
}

/** POST /api/logout: clears the session cookie. */
export function handleLogout(): Response {
  return new Response(null, {
    status: HTTP_STATUS.noContent,
    headers: { [HEADER.setCookie]: clearedSessionCookie() },
  });
}

/** The request's session, or null. */
export function sessionOf(
  request: Request,
  credentials: Credentials,
  now: number = Date.now(),
): Promise<{ expiresAt: number } | null> {
  const token = readCookie(request.headers.get(HEADER.cookie), SESSION_COOKIE);
  return verifySession(credentials.sessionSecret, token, now);
}

/** GET /api/me: the signed-in user and the session expiry. */
export async function handleMe(
  request: Request,
  credentials: Credentials,
  now: number = Date.now(),
): Promise<Response> {
  const session = await sessionOf(request, credentials, now);
  if (session === null) return unauthorized();
  return json(
    { user: credentials.user, expiresAt: session.expiresAt },
    { headers: { [HEADER.cacheControl]: CACHE_CONTROL.private } },
  );
}

/** 401 when the request has no session; null when it may proceed. */
export async function requireSession(
  request: Request,
  credentials: Credentials,
  now: number = Date.now(),
): Promise<Response | null> {
  return (await sessionOf(request, credentials, now)) === null ? unauthorized() : null;
}

/** 403 when a mutating request lacks the panel's header; null when it may proceed. */
export function requireCsrfHeader(request: Request): Response | null {
  return request.headers.get(HEADER.requestedWith) === CSRF_HEADER_VALUE
    ? null
    : json({ error: 'forbidden' }, { status: HTTP_STATUS.forbidden });
}

/** Allows every attempt; for local development without a rate-limit binding. */
export const OPEN_LIMITER: LoginLimiter = { allow: () => Promise.resolve(true) };
