import { describe, expect, it } from 'vitest';
import { hashtagCount, publishFailure } from '@admin/core/post/post-publish';

describe('hashtagCount', () => {
  it('counts the tags of a caption, accents and digits included', () => {
    const caption = 'Encapsulada de frutas.\n\n#gelatina #postrescaracas #cumpleaños #2026';
    expect(hashtagCount(caption)).toBe(4);
    expect(hashtagCount('Sin etiquetas, y un # suelto.')).toBe(0);
  });
});

describe('publishFailure', () => {
  it('keeps what Instagram said when it refused before anything was posted', () => {
    expect(
      publishFailure({ error: 'instagram-rejected', detail: 'Media download failed' }),
    ).toEqual({ kind: 'rejected', detail: 'Media download failed' });
    expect(publishFailure({ error: 'instagram-unconfigured', detail: null })).toEqual({
      kind: 'rejected',
      detail: null,
    });
    expect(publishFailure({ error: 'unauthorized' }).kind).toBe('rejected');
  });

  it('tells a slow Instagram apart: nothing was sent, trying again is safe', () => {
    expect(publishFailure({ error: 'instagram-slow', detail: null })).toEqual({
      kind: 'slow',
      detail: null,
    });
  });

  it('counts anything else as uncertain, because the post may be live', () => {
    expect(publishFailure({ error: 'instagram-uncertain', detail: 'timeout' })).toEqual({
      kind: 'uncertain',
      detail: 'timeout',
    });
    expect(publishFailure(null).kind).toBe('uncertain');
    expect(publishFailure('<html>502 Bad Gateway</html>').kind).toBe('uncertain');
  });
});
