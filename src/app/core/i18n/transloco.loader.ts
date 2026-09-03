import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';
import { TRANSLATION_ASSET_PATH } from './i18n.constants';

@Service()
export class HttpTranslocoLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  /** Fetches a language file at runtime so switching needs no reload. */
  getTranslation(lang: string) {
    return this.http.get<Translation>(`${TRANSLATION_ASSET_PATH}${lang}.json`);
  }
}
