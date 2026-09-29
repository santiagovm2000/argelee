import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { SITE } from '../../core/config/app.constants';
import { SECTION_IDS } from '../../core/config/routes';
import { LanguageService } from '../../core/i18n/language.service';
import { T } from '../../core/i18n/translation-keys.generated';
import { Bloom } from '../../shared/ui/bloom/bloom';
import { Caustics } from '../../shared/ui/caustics/caustics';
import { Wordmark } from '../../shared/ui/wordmark/wordmark';

/** The page's last word, laid out like the brand's business card: the water, the logo, the sunflowers. */
@Component({
  selector: 'arg-site-footer',
  imports: [RouterLink, TranslocoDirective, Wordmark, Caustics, Bloom],
  templateUrl: './site-footer.html',
})
export class SiteFooter {
  protected readonly t = T;
  protected readonly site = SITE;
  protected readonly sections = SECTION_IDS;
  protected readonly language = inject(LanguageService);
  protected readonly year = new Date().getFullYear();
}
