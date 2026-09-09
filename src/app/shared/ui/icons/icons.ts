import type { FlavourId, FruitId } from '../../../core/catalog/catalog.model';

// The glyphs are plain SVG files under public/icons, one per drawing, each with
// its root element id'd `glyph`. A template draws one with <use href="...">,
// so the file is fetched once and the glyph takes the current text colour.
const ICONS_DIR = 'icons';
const CHOICES_DIR = `${ICONS_DIR}/choices`;
const GLYPH_FRAGMENT = '#glyph';

export const ICON_URLS = {
  whatsapp: `${ICONS_DIR}/whatsapp.svg${GLYPH_FRAGMENT}`,
} as const;

/** The glyph file of a flavour or fruit, named after its option id. */
export function choiceIconUrl(id: FlavourId | FruitId): string {
  return `${CHOICES_DIR}/${id}.svg${GLYPH_FRAGMENT}`;
}
