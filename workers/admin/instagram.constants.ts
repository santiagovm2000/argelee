// The Instagram API with Instagram Login, the one a token generated in the app
// dashboard speaks to.
export const INSTAGRAM_API = 'https://graph.instagram.com';
export const INSTAGRAM_API_VERSION = 'v25.0';
export const TOKEN_REFRESH_PATH = 'refresh_access_token';
export const TOKEN_REFRESH_GRANT = 'ig_refresh_token';

export const CONTAINER_STATE = { ready: 'FINISHED', pending: 'IN_PROGRESS' } as const;
export const CONTAINER_POLL = { attempts: 10, intervalMs: 1500 } as const;

// A slide waits in R2 only while Instagram fetches it, under a prefix of its
// own so that clearing up can never reach a catalogue photo. Its public path
// is the same as its key.
export const SLIDE_KEY_PREFIX = 'posts/';
export const SLIDE_NAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;
export const MAX_SLIDE_BYTES = 8_388_608;
export const STALE_SLIDE_MS = 60 * 60 * 1000;

// The renewed token is kept in KV sealed with the secret it descends from:
// AES-GCM, the nonce and the ciphertext joined by a dot.
export const TOKEN_KV_KEY = 'instagram:token';
export const TOKEN_NONCE_BYTES = 12;
export const TOKEN_SEAL_SEPARATOR = '.';
