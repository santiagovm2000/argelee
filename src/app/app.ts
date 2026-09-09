import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { filter, map } from 'rxjs';
import { FULL_CHROME, pageChrome } from './core/config/page-chrome';
import { T } from './core/i18n/translation-keys.generated';
import { SiteFooter } from './layout/site-footer/site-footer';
import { SiteHeader } from './layout/site-header/site-header';
import { WhatsappButton } from './layout/whatsapp-button/whatsapp-button';

@Component({
  selector: 'arg-root',
  imports: [RouterOutlet, RouterLink, SiteHeader, SiteFooter, WhatsappButton, TranslocoDirective],
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);

  protected readonly t = T;

  // The chrome the current page asks for, settled once each navigation lands.
  protected readonly chrome = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => pageChrome(this.router.routerState.snapshot)),
    ),
    { initialValue: FULL_CHROME },
  );
}
