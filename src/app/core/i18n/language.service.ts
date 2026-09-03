import { DOCUMENT } from '@angular/common';
import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { localizedUrl, pathSegments } from '../config/routes';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_TAGS,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from './i18n.constants';

@Service()
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  private readonly active = signal<SupportedLanguage>(DEFAULT_LANGUAGE);

  readonly current = this.active.asReadonly();
  readonly available = SUPPORTED_LANGUAGES;
  readonly currentTag = computed<string>(() => LANGUAGE_TAGS[this.active()]);

  readonly homeUrl = computed<string>(() => localizedUrl(this.active()));

  readonly alternates = computed<Readonly<Record<SupportedLanguage, string>>>(() => {
    const url = this.router.lastSuccessfulNavigation()?.finalUrl?.toString() ?? this.router.url;
    const segments = pathSegments(url);
    return Object.fromEntries(
      SUPPORTED_LANGUAGES.map((language) => [language, localizedUrl(language, segments)]),
    ) as Record<SupportedLanguage, string>;
  });

  /** Points Transloco and the document at a language. The URL is the source of truth, not storage. */
  activate(language: SupportedLanguage): void {
    this.active.set(language);
    this.transloco.setActiveLang(language);
    this.document.documentElement.lang = LANGUAGE_TAGS[language];
  }
}
