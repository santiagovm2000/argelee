import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { SECTION_IDS } from '../../core/config/routes';
import { LanguageService } from '../../core/i18n/language.service';
import { T } from '../../core/i18n/translation-keys.generated';
import { Wordmark } from '../../shared/ui/wordmark/wordmark';

@Component({
  selector: 'arg-site-header',
  imports: [RouterLink, TranslocoDirective, LanguageSwitcher, ThemeToggle, Wordmark],
  templateUrl: './site-header.html',
})
export class SiteHeader {
  protected readonly t = T;
  protected readonly language = inject(LanguageService);
  protected readonly sections = SECTION_IDS;
}
