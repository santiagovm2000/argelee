import { Service } from '@angular/core';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';
import es from '../../../../public/i18n/es.json';
import { DEFAULT_LANGUAGE, type SupportedLanguage } from './i18n.constants';

const TRANSLATIONS: Readonly<Record<SupportedLanguage, Translation>> = {
  es,
};

@Service()
export class ServerTranslocoLoader implements TranslocoLoader {
  /** Serves translations from the bundle: prerendering has no HTTP server to fetch from. */
  getTranslation(lang: string) {
    const key = lang as SupportedLanguage;
    return of(TRANSLATIONS[key] ?? TRANSLATIONS[DEFAULT_LANGUAGE]);
  }
}
