import { provideHttpClient } from '@angular/common/http';
import {
  type EnvironmentProviders,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './i18n.constants';
import { LanguageService } from './language.service';
import { HttpTranslocoLoader } from './transloco.loader';

/** Wires runtime translation. The server build swaps the loader token for prerendering. */
export function provideI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: [...SUPPORTED_LANGUAGES],
        defaultLang: DEFAULT_LANGUAGE,
        fallbackLang: DEFAULT_LANGUAGE,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: {
          logMissingKey: isDevMode(),
          useFallbackTranslation: true,
          allowEmpty: false,
        },
      },
      loader: HttpTranslocoLoader,
    }),
    provideAppInitializer(() => {
      inject(LanguageService).initialize();
    }),
  ]);
}
