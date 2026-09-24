import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { Wordmark } from '@shared/ui/wordmark/wordmark';
import { T } from '../../core/i18n/translation-keys.generated';
import { AdminMenu } from '../admin-menu/admin-menu';

/** The panel's top bar: the mark, the panel's name, and the menu in the corner. */
@Component({
  selector: 'arg-admin-header',
  imports: [RouterLink, TranslocoDirective, Wordmark, AdminMenu],
  templateUrl: './admin-header.html',
  host: { class: 'block' },
})
export class AdminHeader {
  protected readonly t = T;
}
