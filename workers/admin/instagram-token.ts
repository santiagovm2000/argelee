import type { TextSlot } from '../shared/stores';
import { TOKEN_NONCE_BYTES, TOKEN_SEAL_SEPARATOR } from './instagram.constants';
import { fromBase64Url, toBase64Url } from './session';

// Instagram's token lasts sixty days and is renewed by trading it for a new
// one. The owner sets the first as a Worker secret; a Worker cannot rewrite its
// own secrets, so each renewal is kept in KV, encrypted with a key derived from
// that secret. What rests in KV is useless without the secret, and a secret the
// owner replaces simply stops opening the old seal and takes over.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function sealingKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/** Encrypts a token so only the holder of the secret it descends from can read it. */
export async function sealToken(secret: string, token: string): Promise<string> {
  const nonce = crypto.getRandomValues(new Uint8Array(TOKEN_NONCE_BYTES));
  const sealed = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    await sealingKey(secret),
    encoder.encode(token),
  );
  return `${toBase64Url(nonce)}${TOKEN_SEAL_SEPARATOR}${toBase64Url(new Uint8Array(sealed))}`;
}

/** The token inside a seal, or null when another secret made it or it is damaged. */
export async function openToken(secret: string, seal: string): Promise<string | null> {
  const [noncePart, sealedPart, ...rest] = seal.split(TOKEN_SEAL_SEPARATOR);
  const nonce = fromBase64Url(noncePart ?? '');
  const sealed = fromBase64Url(sealedPart ?? '');
  if (nonce === null || sealed === null || rest.length > 0) return null;
  try {
    const token = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      await sealingKey(secret),
      sealed,
    );
    return decoder.decode(token);
  } catch {
    return null;
  }
}

/** The token to call Instagram with: the last renewal this secret made, else the secret itself. */
export async function currentToken(secret: string, slot: TextSlot): Promise<string> {
  const seal = await slot.read();
  if (seal === null) return secret;
  return (await openToken(secret, seal)) ?? secret;
}

/** Renews the token in use and keeps the result sealed; a refusal leaves everything as it was. */
export async function renewToken(
  secret: string,
  slot: TextSlot,
  refresh: (token: string) => Promise<string>,
): Promise<boolean> {
  const token = await currentToken(secret, slot);
  let renewed: string;
  try {
    renewed = await refresh(token);
  } catch {
    return false;
  }
  await slot.write(await sealToken(secret, renewed));
  return true;
}
