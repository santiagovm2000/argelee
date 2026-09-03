import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ROUTE_LINKS } from '../../core/config/routes';
import { T } from '../../core/i18n/translation-keys.generated';

@Component({
  selector: 'arg-not-found-page',
  imports: [RouterLink, TranslocoDirective],
  templateUrl: './not-found-page.html',
})
export class NotFoundPage {
  protected readonly t = T;
  protected readonly links = ROUTE_LINKS;
}
