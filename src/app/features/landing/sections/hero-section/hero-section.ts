import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { OrderService } from '../../../../core/catalog/order.service';
import { SECTION_IDS } from '../../../../core/config/routes';
import { IMAGES } from '../../../../core/images/image-manifest.generated';
import { IMAGE_SIZES } from '../../../../core/images/image.constants';
import { srcsetFor } from '../../../../core/images/image.loader';
import { LanguageService } from '../../../../core/i18n/language.service';
import { T } from '../../../../core/i18n/translation-keys.generated';
import { HERO_VIDEO } from './hero.constants';

/** Full-bleed video with the headline over it. The poster is the LCP image and the reduced-motion fallback. */
@Component({
  selector: 'arg-hero-section',
  imports: [NgOptimizedImage, RouterLink, TranslocoDirective],
  templateUrl: './hero-section.html',
  host: { class: 'block' },
})
export class HeroSection {
  protected readonly t = T;
  protected readonly language = inject(LanguageService);
  protected readonly order = inject(OrderService);
  protected readonly sections = SECTION_IDS;
  protected readonly video = HERO_VIDEO;
  protected readonly poster = IMAGES.heroPoster;
  protected readonly posterSrcset = srcsetFor(IMAGES.heroPoster);
  protected readonly posterSizes = IMAGE_SIZES.hero;
}
