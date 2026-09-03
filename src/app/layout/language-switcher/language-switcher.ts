import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LanguageService } from '../../core/i18n/language.service';
import type { SupportedLanguage } from '../../core/i18n/i18n.constants';
import { T } from '../../core/i18n/translation-keys.generated';

@Component({
  selector: 'arg-language-switcher',
  imports: [RouterLink, TranslocoDirective],
  templateUrl: './language-switcher.html',
})
export class LanguageSwitcher {
  protected readonly language = inject(LanguageService);
  protected readonly t = T;

  /** Maps a language code to its own typed label key. */
  protected labelKey(code: SupportedLanguage): string {
    return this.t.common.language[code];
  }
}
