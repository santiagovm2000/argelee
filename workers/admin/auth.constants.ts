export const PASSWORD_HASH_ALGORITHM = 'pbkdf2-sha256';
export const PASSWORD_HASH_ITERATIONS = 30_000;
export const PASSWORD_SALT_BYTES = 16;
export const PASSWORD_HASH_BITS = 256;
export const PASSWORD_HASH_SEPARATOR = '$';

export const SESSION_COOKIE = 'arg_session';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_SECRET_BYTES = 32;
export const SESSION_TOKEN_SEPARATOR = '.';

export const LOGIN_ATTEMPTS_PER_MINUTE = 5;
export const LOGIN_RETRY_AFTER_SECONDS = 60;
