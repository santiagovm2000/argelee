import { Component, inject, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { OrderService } from '../../../../core/catalog/order.service';
import { SITE } from '../../../../core/config/app.constants';
import { ROUTE_PATHS } from '../../../../core/config/routes';
import { IMAGES } from '../../../../core/images/image-manifest.generated';
import { LanguageService } from '../../../../core/i18n/language.service';
import { T } from '../../../../core/i18n/translation-keys.generated';
import { SeoService } from '../../../../core/seo/seo.service';
import { Lead } from '../../../../shared/directives/lead';
import { Bloom } from '../../../../shared/ui/bloom/bloom';
import { Caustics } from '../../../../shared/ui/caustics/caustics';
import { ICON_URLS } from '../../../../shared/ui/icons/icons';
import { Wordmark } from '../../../../shared/ui/wordmark/wordmark';

/**
 * The link hub behind the QR code and the social bios: the brand's cover on one
 * phone screen, the logo and its tagline on the water, and four ways in:
 * WhatsApp, the site, the PDF price list and Instagram.
 */
@Component({
  selector: 'arg-links-page',
  imports: [RouterLink, TranslocoDirective, Wordmark, Lead, Caustics, Bloom],
  templateUrl: './links-page.html',
})
export class LinksPage implements OnInit {
  private readonly seo = inject(SeoService);
  protected readonly order = inject(OrderService);
  protected readonly language = inject(LanguageService);

  protected readonly t = T;
  protected readonly site = SITE;
  protected readonly icons = ICON_URLS;

  ngOnInit(): void {
    this.seo.apply({
      titleKey: T.meta.links.title,
      descriptionKey: T.meta.links.description,
      segments: [ROUTE_PATHS.links],
      image: IMAGES.brandWordmark.social,
    });
  }
}
