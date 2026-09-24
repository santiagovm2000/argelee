import { DOCUMENT } from '@angular/common';
import { computed, inject, Service, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { localizedUrl } from '../config/routes';
import { DEFAULT_LANGUAGE, LANGUAGE_TAGS, type SupportedLanguage } from './i18n.constants';

@Service()
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);

  private readonly active = signal<SupportedLanguage>(DEFAULT_LANGUAGE);

  readonly current = this.active.asReadonly();
  readonly currentTag = computed<string>(() => LANGUAGE_TAGS[this.active()]);

  readonly homeUrl = computed<string>(() => localizedUrl(this.active()));

  /** Points Transloco and the document at a language. The URL is the source of truth, not storage. */
  activate(language: SupportedLanguage): void {
    this.active.set(language);
    this.transloco.setActiveLang(language);
    this.document.documentElement.lang = LANGUAGE_TAGS[language];
  }
}
