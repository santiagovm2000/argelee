import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { SiteFooter } from './layout/site-footer/site-footer';
import { SiteHeader } from './layout/site-header/site-header';
import { WhatsappButton } from './layout/whatsapp-button/whatsapp-button';
import { T } from './core/i18n/translation-keys.generated';

@Component({
  selector: 'arg-root',
  imports: [RouterOutlet, RouterLink, SiteHeader, SiteFooter, WhatsappButton, TranslocoDirective],
  templateUrl: './app.html',
})
export class App {
  protected readonly t = T;
}
