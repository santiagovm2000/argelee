import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { ROUTE_LINKS } from '../../core/config/routes';
import { SITE } from '../../core/config/app.constants';
import { T } from '../../core/i18n/translation-keys.generated';

@Component({
  selector: 'arg-site-header',
  imports: [RouterLink, TranslocoDirective, LanguageSwitcher, ThemeToggle],
  templateUrl: './site-header.html',
})
export class SiteHeader {
  protected readonly t = T;
  protected readonly links = ROUTE_LINKS;
  protected readonly site = SITE;
}
