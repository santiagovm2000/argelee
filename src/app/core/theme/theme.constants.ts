export const COLOR_SCHEMES = ['light', 'dark'] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

export const THEME_PREFERENCES = ['system', ...COLOR_SCHEMES] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

export const COLOR_SCHEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';
export const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

// A theme change spreads from the toggle as a growing circle. The class scopes
// the view-transition CSS to that moment; the tokens are read from the stylesheet.
export const THEME_REVEAL_CLASS = 'arg-theme-reveal';
export const THEME_REVEAL_DURATION_TOKEN = '--duration-reveal';
export const THEME_REVEAL_EASING_TOKEN = '--ease-out-quart';
export const THEME_REVEAL_FALLBACK_MS = 700;
export const MS_PER_SECOND = 1000;

/** Narrows an arbitrary string to a stored theme preference. */
export function isThemePreference(value: string): value is ThemePreference {
  return (THEME_PREFERENCES as readonly string[]).includes(value);
}
