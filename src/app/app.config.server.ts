import { mergeApplicationConfig, type ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { provideTranslocoLoader } from '@jsverse/transloco';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { ServerTranslocoLoader } from './core/i18n/transloco-server.loader';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideTranslocoLoader(ServerTranslocoLoader),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
