import type { PublishFailure } from '@workers/shared/instagram.model';

export type PublishTrouble = 'rejected' | 'uncertain' | 'slow' | 'offline';

export interface PublishedPost {
  readonly kind: 'published';
}

export interface FailedPost {
  readonly kind: PublishTrouble;
  readonly detail: string | null;
}

export type PublishOutcome = PublishedPost | FailedPost;

const HASHTAG = /#[\p{L}\p{N}_]+/gu;
const SLOW: PublishFailure = 'instagram-slow';
const NOTHING_SENT: readonly string[] = [
  'bad-request',
  'instagram-unconfigured',
  'instagram-rejected',
  'unauthorized',
  'forbidden',
];

/** How many hashtags a caption carries; Instagram reads only the first few. */
export function hashtagCount(caption: string): number {
  return caption.match(HASHTAG)?.length ?? 0;
}

/**
 * What a failed publish request means for the owner. Anything that does not
 * say plainly that nothing was sent counts as uncertain: the post may be live.
 */
export function publishFailure(body: unknown): FailedPost {
  const fields: { error?: unknown; detail?: unknown } =
    typeof body === 'object' && body !== null ? body : {};
  const detail = typeof fields.detail === 'string' && fields.detail !== '' ? fields.detail : null;
  if (fields.error === SLOW) return { kind: 'slow', detail: null };
  if (typeof fields.error === 'string' && NOTHING_SENT.includes(fields.error)) {
    return { kind: 'rejected', detail };
  }
  return { kind: 'uncertain', detail };
}
