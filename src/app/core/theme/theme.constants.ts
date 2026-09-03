import { DARK_THEME_CLASS } from '../config/app.constants';

export const COLOR_SCHEMES = ['light', 'dark'] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

export const THEME_PREFERENCES = ['system', ...COLOR_SCHEMES] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

export const PRIMENG_DARK_MODE_SELECTOR = `.${DARK_THEME_CLASS}`;

export const PRIMENG_CSS_LAYER = {
  name: 'primeng',
  order: 'theme, base, primeng, components, utilities',
} as const;

export const COLOR_SCHEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';

/** Narrows an arbitrary string to a stored theme preference. */
export function isThemePreference(value: string): value is ThemePreference {
  return (THEME_PREFERENCES as readonly string[]).includes(value);
}
