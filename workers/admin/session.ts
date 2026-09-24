import {
  PASSWORD_HASH_ALGORITHM,
  PASSWORD_HASH_BITS,
  PASSWORD_HASH_ITERATIONS,
  PASSWORD_HASH_SEPARATOR,
  PASSWORD_SALT_BYTES,
  SESSION_COOKIE,
  SESSION_TOKEN_SEPARATOR,
  SESSION_TTL_MS,
} from './auth.constants';

const encoder = new TextEncoder();

const HASH_PARTS = 4;
const MS_PER_SECOND = 1000;

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

/** Constant-time comparison; different lengths compare as unequal. */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    PASSWORD_HASH_BITS,
  );
  return new Uint8Array(bits);
}

/** Salted PBKDF2 digest as `pbkdf2-sha256$iterations$salt$digest`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PASSWORD_SALT_BYTES));
  const digest = await deriveKey(password, salt, PASSWORD_HASH_ITERATIONS);
  return [
    PASSWORD_HASH_ALGORITHM,
    String(PASSWORD_HASH_ITERATIONS),
    toBase64Url(salt),
    toBase64Url(digest),
  ].join(PASSWORD_HASH_SEPARATOR);
}

/** Verifies a password against a stored digest; malformed records never verify. */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(PASSWORD_HASH_SEPARATOR);
  if (parts.length !== HASH_PARTS || parts[0] !== PASSWORD_HASH_ALGORITHM) return false;
  const iterations = Number.parseInt(parts[1] ?? '', 10);
  const salt = fromBase64Url(parts[2] ?? '');
  const expected = fromBase64Url(parts[3] ?? '');
  if (!Number.isInteger(iterations) || iterations <= 0 || salt === null || expected === null) {
    return false;
  }
  const actual = await deriveKey(password, salt, iterations);
  return constantTimeEqual(actual, expected);
}

/** Constant-time name comparison via fixed-length digests. */
export async function sameName(a: string, b: string): Promise<boolean> {
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  return constantTimeEqual(new Uint8Array(digestA), new Uint8Array(digestB));
}

async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

export interface Session {
  readonly expiresAt: number;
}

/** Session token: expiry timestamp plus its HMAC. */
export async function issueSession(secret: string, now: number = Date.now()): Promise<string> {
  const expiresAt = now + SESSION_TTL_MS;
  const signature = await hmac(secret, String(expiresAt));
  return `${String(expiresAt)}${SESSION_TOKEN_SEPARATOR}${toBase64Url(signature)}`;
}

/** The session behind a token, or null when forged, damaged or expired. */
export async function verifySession(
  secret: string,
  token: string | null,
  now: number = Date.now(),
): Promise<Session | null> {
  if (token === null) return null;
  const separator = token.indexOf(SESSION_TOKEN_SEPARATOR);
  if (separator === -1) return null;
  const expiresAt = Number.parseInt(token.slice(0, separator), 10);
  const signature = fromBase64Url(token.slice(separator + 1));
  if (!Number.isInteger(expiresAt) || signature === null) return null;
  const expected = await hmac(secret, String(expiresAt));
  if (!constantTimeEqual(signature, expected)) return null;
  return expiresAt > now ? { expiresAt } : null;
}

/** Reads one cookie from a Cookie header. */
export function readCookie(header: string | null, name: string): string | null {
  if (header === null) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

/** Set-Cookie for a session: HttpOnly, Secure, SameSite=Strict. */
export function sessionCookie(token: string, expiresAt: number, now: number = Date.now()): string {
  const maxAge = Math.max(0, Math.floor((expiresAt - now) / MS_PER_SECOND));
  return `${SESSION_COOKIE}=${token}; Max-Age=${String(maxAge)}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

/** Set-Cookie that removes the session. */
export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

/** Random bytes as base64url, for signing secrets. */
export function randomSecret(bytes: number): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}
