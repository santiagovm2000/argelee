import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, PLATFORM_ID, Service, signal } from '@angular/core';
import { DARK_THEME_CLASS, STORAGE_KEYS } from '../config/app.constants';
import {
  COLOR_SCHEME_MEDIA_QUERY,
  DEFAULT_THEME_PREFERENCE,
  isThemePreference,
  REDUCED_MOTION_MEDIA_QUERY,
  THEME_REVEAL_CLASS,
  THEME_REVEAL_DURATION_TOKEN,
  THEME_REVEAL_EASING_TOKEN,
  THEME_REVEAL_FALLBACK_MS,
  MS_PER_SECOND,
  type ColorScheme,
  type ThemePreference,
} from './theme.constants';

export interface ViewportPoint {
  readonly x: number;
  readonly y: number;
}

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

  /**
   * Flips the theme and, where the browser can, lets the new colours spread from
   * a point as a growing circle. Falls back to a plain flip without view
   * transitions or when the visitor prefers reduced motion.
   */
  toggleFrom(origin: ViewportPoint): void {
    const next: ThemePreference = this.isDark() ? 'light' : 'dark';
    const view = this.document.defaultView;
    const canReveal =
      this.isBrowser &&
      view !== null &&
      view !== undefined &&
      !view.matchMedia(REDUCED_MOTION_MEDIA_QUERY).matches &&
      typeof this.document.startViewTransition === 'function';
    if (!canReveal) {
      this.set(next);
      return;
    }

    const root = this.document.documentElement;
    root.classList.add(THEME_REVEAL_CLASS);
    const transition = this.document.startViewTransition(() => {
      // Apply the class now: the snapshot of the new state is taken when this
      // callback returns, before the effect above gets a chance to run.
      root.classList.toggle(DARK_THEME_CLASS, next === 'dark');
      this.set(next);
    });

    const radius = Math.hypot(
      Math.max(origin.x, view.innerWidth - origin.x),
      Math.max(origin.y, view.innerHeight - origin.y),
    );
    void transition.ready
      .then(() => {
        const style = view.getComputedStyle(root);
        root.animate(
          {
            clipPath: [
              `circle(0px at ${origin.x}px ${origin.y}px)`,
              `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
            ],
          },
          {
            duration: parseDuration(style.getPropertyValue(THEME_REVEAL_DURATION_TOKEN)),
            easing: style.getPropertyValue(THEME_REVEAL_EASING_TOKEN).trim() || 'ease',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      })
      .catch(() => undefined);
    void transition.finished.finally(() => {
      root.classList.remove(THEME_REVEAL_CLASS);
    });
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

/** Turns a CSS time such as "720ms" or "0.7s" into milliseconds. */
function parseDuration(value: string): number {
  const trimmed = value.trim();
  const amount = Number.parseFloat(trimmed);
  if (Number.isNaN(amount)) return THEME_REVEAL_FALLBACK_MS;
  return trimmed.endsWith('ms') ? amount : amount * MS_PER_SECOND;
}
