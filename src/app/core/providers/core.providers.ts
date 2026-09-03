import {
  type EnvironmentProviders,
  makeEnvironmentProviders,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { routes } from '../../app.routes';
import { PRIMENG_LICENSE_KEY } from '../config/build-config.generated';
import { provideI18n } from '../i18n/i18n.providers';
import { provideImages } from '../images/image.loader';
import { ThemePreset } from '../theme/theme.preset';
import { PRIMENG_CSS_LAYER, PRIMENG_DARK_MODE_SELECTOR } from '../theme/theme.constants';

/** Everything the app needs to boot, in one place. */
export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withViewTransitions(),
    ),
    provideI18n(),
    provideImages(),
    providePrimeNG({
      license: PRIMENG_LICENSE_KEY,
      theme: {
        preset: ThemePreset,
        options: {
          darkModeSelector: PRIMENG_DARK_MODE_SELECTOR,
          cssLayer: PRIMENG_CSS_LAYER,
        },
      },
      ripple: false,
      inputVariant: 'outlined',
    }),
  ]);
}
