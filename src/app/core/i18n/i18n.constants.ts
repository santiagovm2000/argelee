export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

export const LANGUAGE_TAGS: Readonly<Record<SupportedLanguage, string>> = {
  es: 'es-ES',
  en: 'en-US',
};

// Relative on purpose: the browser resolves it against <base href>, so it keeps
// working when the site is served from a subpath (e.g. GitHub Pages project sites).
export const TRANSLATION_ASSET_PATH = 'i18n/';

/** Narrows an arbitrary string to a language the app actually ships. */
export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
