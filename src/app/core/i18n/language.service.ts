import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, inject, PLATFORM_ID, Service, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { STORAGE_KEYS } from '../config/app.constants';
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  LANGUAGE_TAGS,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from './i18n.constants';

@Service()
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly active = signal<SupportedLanguage>(DEFAULT_LANGUAGE);

  readonly current = this.active.asReadonly();
  readonly available = SUPPORTED_LANGUAGES;
  readonly currentTag = computed<string>(() => LANGUAGE_TAGS[this.active()]);

  /** Resolves the startup language: stored choice, then browser preference, then default. */
  initialize(): void {
    const resolved = this.isBrowser
      ? (this.readStoredLanguage() ?? this.readBrowserLanguage() ?? DEFAULT_LANGUAGE)
      : DEFAULT_LANGUAGE;
    this.apply(resolved, { persist: false });
  }

  /** Switches the active language. */
  use(language: SupportedLanguage): void {
    if (language === this.active()) return;
    this.apply(language, { persist: true });
  }

  /** Applies a language to Transloco and the document, optionally persisting it. */
  private apply(language: SupportedLanguage, options: { persist: boolean }): void {
    this.active.set(language);
    this.transloco.setActiveLang(language);
    this.document.documentElement.lang = LANGUAGE_TAGS[language];

    if (options.persist && this.isBrowser) {
      try {
        this.document.defaultView?.localStorage.setItem(STORAGE_KEYS.language, language);
      } catch {
        // Storage can be blocked; the app still works, the choice just is not remembered.
      }
    }
  }

  /** Reads a previously chosen language, ignoring anything no longer supported. */
  private readStoredLanguage(): SupportedLanguage | null {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(STORAGE_KEYS.language);
      return stored !== null && stored !== undefined && isSupportedLanguage(stored) ? stored : null;
    } catch {
      return null;
    }
  }

  /** Picks the first browser-preferred language the app ships. */
  private readBrowserLanguage(): SupportedLanguage | null {
    const preferred = this.document.defaultView?.navigator.languages ?? [];
    for (const tag of preferred) {
      const base = tag.split('-')[0]?.toLowerCase() ?? '';
      if (isSupportedLanguage(base)) return base;
    }
    return null;
  }
}
