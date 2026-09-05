import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { SITE } from '../../core/config/app.constants';
import { T } from '../../core/i18n/translation-keys.generated';
import { Wordmark } from '../../shared/ui/wordmark/wordmark';

@Component({
  selector: 'arg-site-footer',
  imports: [TranslocoDirective, Wordmark],
  templateUrl: './site-footer.html',
})
export class SiteFooter {
  protected readonly t = T;
  protected readonly site = SITE;
  protected readonly year = new Date().getFullYear();
}
