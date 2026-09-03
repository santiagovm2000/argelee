import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, PLATFORM_ID, Service, signal } from '@angular/core';
import { DARK_THEME_CLASS, STORAGE_KEYS } from '../config/app.constants';
import {
  COLOR_SCHEME_MEDIA_QUERY,
  DEFAULT_THEME_PREFERENCE,
  isThemePreference,
  type ColorScheme,
  type ThemePreference,
} from './theme.constants';

@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly systemPrefersDark = signal(false);
  private readonly preferenceState = signal<ThemePreference>(DEFAULT_THEME_PREFERENCE);

  readonly preference = this.preferenceState.asReadonly();

  readonly scheme = computed<ColorScheme>(() => {
    const preference = this.preferenceState();
    if (preference !== 'system') return preference;
    return this.systemPrefersDark() ? 'dark' : 'light';
  });

  readonly isDark = computed(() => this.scheme() === 'dark');

  constructor() {
    if (this.isBrowser) {
      this.preferenceState.set(this.readStoredPreference() ?? DEFAULT_THEME_PREFERENCE);
      this.watchSystemPreference();
    }

    effect(() => {
      const dark = this.isDark();
      if (!this.isBrowser) return;
      this.document.documentElement.classList.toggle(DARK_THEME_CLASS, dark);
    });
  }

  /** Stores an explicit preference; 'system' hands control back to the OS. */
  set(preference: ThemePreference): void {
    this.preferenceState.set(preference);
    if (!this.isBrowser) return;
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEYS.theme, preference);
    } catch {
      // Storage can be blocked; the theme still applies for this session.
    }
  }

  /** Flips to the opposite of what is currently on screen. */
  toggle(): void {
    this.set(this.isDark() ? 'light' : 'dark');
  }

  /** Tracks prefers-color-scheme so 'system' keeps following the OS. */
  private watchSystemPreference(): void {
    const query = this.document.defaultView?.matchMedia(COLOR_SCHEME_MEDIA_QUERY);
    if (query === undefined) return;
    this.systemPrefersDark.set(query.matches);
    query.addEventListener('change', (event) => {
      this.systemPrefersDark.set(event.matches);
    });
  }

  /** Reads the stored preference, ignoring anything unrecognised. */
  private readStoredPreference(): ThemePreference | null {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(STORAGE_KEYS.theme);
      return stored !== null && stored !== undefined && isThemePreference(stored) ? stored : null;
    } catch {
      return null;
    }
  }
}
