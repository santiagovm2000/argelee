import { describe, expect, it } from 'vitest';
import type { LocalizedText, ProductText } from '@core/catalog/catalog.model';
import { localizedText } from '@core/catalog/localized-text';

const spanish: ProductText = {
  name: 'Corona tres leches',
  note: 'nota',
  description: 'descripción',
};

describe('localizedText', () => {
  it('returns the text in the asked language', () => {
    const text: LocalizedText = { es: spanish };
    expect(localizedText(text, 'es')).toBe(spanish);
  });
});
