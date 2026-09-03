import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { DEFAULT_LANGUAGE, isSupportedLanguage } from './i18n.constants';
import { LanguageService } from './language.service';

/** Applies the route's language before the page renders, so prerendered HTML ships localized. */
export const applyRouteLanguage: CanActivateFn = (route) => {
  const declared: unknown = route.data['language'];
  const language =
    typeof declared === 'string' && isSupportedLanguage(declared) ? declared : DEFAULT_LANGUAGE;
  inject(LanguageService).activate(language);
  return true;
};
