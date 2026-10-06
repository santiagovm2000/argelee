import { describe, expect, it } from 'vitest';
import { DEFAULT_FRAMING, POST_BACKDROPS, ZOOM } from '@admin/core/post/post.constants';
import {
  blendsInto,
  clampFraming,
  colourDistance,
  fileSlug,
  fittingSize,
  inkToneOn,
  localPhone,
  luminance,
  nudgedFraming,
  photoPlacement,
  wrapLines,
} from '@admin/core/post/post-text';

const CHARACTER_WIDTH = 10;
const byCharacters = (line: string): number => line.length * CHARACTER_WIDTH;
const DIAMETER = 100;
const LANDSCAPE = { width: 400, height: 200 };
const SQUARE = { width: 300, height: 300 };

describe('luminance', () => {
  it('runs from black to white', () => {
    expect(luminance('#000000')).toBe(0);
    expect(luminance('#ffffff')).toBeCloseTo(1);
  });

  it('reads upper and lower case alike', () => {
    expect(luminance('#008AFF')).toBe(luminance('#008aff'));
  });
});

describe('inkToneOn', () => {
  it('puts white ink on the brand blue and navy on the rest of the palette', () => {
    const tones = Object.fromEntries(
      POST_BACKDROPS.map((option) => [option.id, inkToneOn(option.colour)]),
    );

    expect(tones).toEqual({
      mango: 'dark',
      coral: 'dark',
      crystal: 'light',
      turquoise: 'dark',
      mint: 'dark',
    });
  });

  it('follows any colour the owner picks', () => {
    expect(inkToneOn('#10233f')).toBe('light');
    expect(inkToneOn('#ffca00')).toBe('dark');
  });
});

describe('colourDistance', () => {
  it('is nothing between a colour and itself, whatever the case', () => {
    expect(colourDistance('#FF9000', '#ff9000')).toBe(0);
  });

  it('tells two colours of the same lightness apart by their hue', () => {
    expect(colourDistance('#ff9000', '#00c1ca')).toBeGreaterThan(0.2);
  });
});

describe('blendsInto', () => {
  it('loses the coral pill on a coral slide and the sunflower on a mango one', () => {
    expect(blendsInto('#ff9000', '#ff9000')).toBe(true);
    expect(blendsInto('#FCC928', '#ffca00')).toBe(true);
  });

  it('keeps them on every other colour of the palette', () => {
    const others = ['#ffca00', '#008aff', '#00c1ca', '#00cb7e'];

    expect(others.map((backdrop) => blendsInto('#ff9000', backdrop))).toEqual([
      false,
      false,
      false,
      false,
    ]);
    expect(blendsInto('#FCC928', '#ff9000')).toBe(false);
  });
});

describe('wrapLines', () => {
  it('fills each line up to the measure and never past it', () => {
    expect(wrapLines('fruta fresca a elección', 120, byCharacters)).toEqual([
      'fruta fresca',
      'a elección',
    ]);
  });

  it('keeps a word that is wider than the measure whole, on its own line', () => {
    expect(wrapLines('una transparentísima capa', 80, byCharacters)).toEqual([
      'una',
      'transparentísima',
      'capa',
    ]);
  });

  it('ignores repeated spaces and gives no lines for an empty text', () => {
    expect(wrapLines('  tres   leches ', 200, byCharacters)).toEqual(['tres leches']);
    expect(wrapLines('   ', 200, byCharacters)).toEqual([]);
  });
});

describe('fittingSize', () => {
  it('keeps the cap when the text already fits', () => {
    expect(fittingSize(800, 124, 930)).toBe(124);
  });

  it('shrinks in proportion when it does not', () => {
    expect(fittingSize(1860, 124, 930)).toBe(62);
  });
});

describe('localPhone', () => {
  it('writes the business line the way it is dialled in the country', () => {
    expect(localPhone('584241860627')).toBe('0424-1860627');
  });

  it('leaves a number from elsewhere as it came', () => {
    expect(localPhone('34600111222')).toBe('34600111222');
  });
});

describe('fileSlug', () => {
  it('turns a name into a lower-case, accent-free file name', () => {
    expect(fileSlug('Espiral de parchita')).toBe('espiral-de-parchita');
    expect(fileSlug('  Pie de limón (mini) ')).toBe('pie-de-limon-mini');
  });
});

describe('photoPlacement', () => {
  it('covers the circle with the short side and centres the long one', () => {
    expect(photoPlacement(LANDSCAPE, DIAMETER, DEFAULT_FRAMING)).toEqual({
      x: -50,
      y: -0,
      width: 200,
      height: 100,
    });
  });

  it('shows one end of the photo when it is nudged all the way', () => {
    expect(photoPlacement(LANDSCAPE, DIAMETER, { zoom: 1, x: 1, y: 0 }).x).toBe(-0);
    expect(photoPlacement(LANDSCAPE, DIAMETER, { zoom: 1, x: -1, y: 0 }).x).toBe(-100);
  });

  it('grows around its centre when zoomed', () => {
    expect(photoPlacement(SQUARE, DIAMETER, { zoom: 2, x: 0, y: 0 })).toEqual({
      x: -50,
      y: -50,
      width: 200,
      height: 200,
    });
  });
});

describe('nudgedFraming', () => {
  it('moves the photo by the distance it was dragged', () => {
    const framing = nudgedFraming(DEFAULT_FRAMING, LANDSCAPE, DIAMETER, 25, 0);

    expect(framing.x).toBe(0.5);
    expect(photoPlacement(LANDSCAPE, DIAMETER, framing).x).toBe(-25);
  });

  it('stops at the edge, so the circle is never left uncovered', () => {
    expect(nudgedFraming(DEFAULT_FRAMING, LANDSCAPE, DIAMETER, 900, 0).x).toBe(1);
  });

  it('does not move along a side that has no room', () => {
    expect(nudgedFraming(DEFAULT_FRAMING, LANDSCAPE, DIAMETER, 0, 40).y).toBe(0);
  });
});

describe('clampFraming', () => {
  it('keeps the zoom and the nudge inside their limits', () => {
    expect(clampFraming({ zoom: 9, x: -4, y: 2 })).toEqual({ zoom: ZOOM.max, x: -1, y: 1 });
    expect(clampFraming({ zoom: 0, x: 0, y: 0 }).zoom).toBe(ZOOM.min);
  });
});
