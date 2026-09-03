import type { ApplicationConfig } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideCore } from './core/providers/core.providers';

export const appConfig: ApplicationConfig = {
  providers: [provideCore(), provideClientHydration()],
};
