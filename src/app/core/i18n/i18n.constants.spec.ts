import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  LANGUAGE_TAGS,
  SUPPORTED_LANGUAGES,
} from './i18n.constants';

describe('i18n constants', () => {
  it('narrows a supported code and rejects anything else', () => {
    expect(isSupportedLanguage('es')).toBe(true);
    expect(isSupportedLanguage('fr')).toBe(false);
  });

  it('has a BCP 47 tag for every supported language', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      expect(LANGUAGE_TAGS[language]).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    }
  });

  it('uses a supported language as the fallback', () => {
    expect(isSupportedLanguage(DEFAULT_LANGUAGE)).toBe(true);
  });
});
