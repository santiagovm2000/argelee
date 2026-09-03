import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteFooter } from './layout/site-footer/site-footer';
import { SiteHeader } from './layout/site-header/site-header';
import { T } from './core/i18n/translation-keys.generated';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'arg-root',
  imports: [RouterOutlet, SiteHeader, SiteFooter, TranslocoDirective],
  templateUrl: './app.html',
})
export class App {
  protected readonly t = T;
}
