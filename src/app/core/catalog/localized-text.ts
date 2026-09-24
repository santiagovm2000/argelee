import { DEFAULT_LANGUAGE, type SupportedLanguage } from '../i18n/i18n.constants';
import type { LocalizedText, ProductText } from './catalog.model';

/** The piece's text in the visitor's language, or in the default one when that translation is missing. */
export function localizedText(text: LocalizedText, language: SupportedLanguage): ProductText {
  return text[language] ?? text[DEFAULT_LANGUAGE];
}
