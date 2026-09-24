import { type EnvironmentProviders, isDevMode, makeEnvironmentProviders } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { DEFAULT_LANGUAGE } from '@core/i18n/i18n.constants';
import { HttpTranslocoLoader } from '@core/i18n/transloco.loader';

/** The panel speaks the owner's language only; the loader and the key file format are the site's. */
export function provideAdminI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: [DEFAULT_LANGUAGE],
        defaultLang: DEFAULT_LANGUAGE,
        fallbackLang: DEFAULT_LANGUAGE,
        reRenderOnLangChange: false,
        prodMode: !isDevMode(),
        missingHandler: {
          logMissingKey: isDevMode(),
          useFallbackTranslation: true,
          allowEmpty: false,
        },
      },
      loader: HttpTranslocoLoader,
    }),
  ]);
}
