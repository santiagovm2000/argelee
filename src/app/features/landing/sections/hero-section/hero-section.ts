import { NgOptimizedImage } from '@angular/common';
import { afterNextRender, Component, type ElementRef, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { OrderService } from '../../../../core/catalog/order.service';
import { SECTION_IDS } from '../../../../core/config/routes';
import { IMAGES } from '../../../../core/images/image-manifest.generated';
import { IMAGE_SIZES } from '../../../../core/images/image.constants';
import { srcsetFor } from '../../../../core/images/image.loader';
import { LanguageService } from '../../../../core/i18n/language.service';
import { T } from '../../../../core/i18n/translation-keys.generated';
import { REDUCED_MOTION_MEDIA_QUERY } from '../../../../core/theme/theme.constants';
import { HERO_VIDEO, HERO_VIDEO_START_TIMEOUT_MS } from './hero.constants';

/**
 * Full-bleed video with the headline over it. The poster is the LCP image and
 * the reduced-motion fallback; the video is only fetched once the page has
 * painted and the browser is idle, and never for a visitor saving data.
 */
@Component({
  selector: 'arg-hero-section',
  imports: [NgOptimizedImage, RouterLink, TranslocoDirective],
  templateUrl: './hero-section.html',
  host: { class: 'block' },
})
export class HeroSection {
  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');

  protected readonly t = T;
  protected readonly language = inject(LanguageService);
  protected readonly order = inject(OrderService);
  protected readonly sections = SECTION_IDS;
  protected readonly sources = HERO_VIDEO;
  protected readonly poster = IMAGES.heroPoster;
  protected readonly posterSrcset = srcsetFor(IMAGES.heroPoster);
  protected readonly posterSizes = IMAGE_SIZES.hero;

  constructor() {
    afterNextRender(() => {
      const element = this.video().nativeElement;
      const view = element.ownerDocument.defaultView;
      if (view === null || wantsStillHero(view)) return;
      const start = (): void => {
        element.load();
        void element.play().catch(() => undefined);
      };
      if (typeof view.requestIdleCallback === 'function') {
        view.requestIdleCallback(start, { timeout: HERO_VIDEO_START_TIMEOUT_MS });
      } else {
        view.setTimeout(start, HERO_VIDEO_START_TIMEOUT_MS);
      }
    });
  }
}

/** True when the visitor asked for reduced motion or for lighter data use. */
function wantsStillHero(view: Window): boolean {
  if (view.matchMedia(REDUCED_MOTION_MEDIA_QUERY).matches) return true;
  const navigator: unknown = view.navigator;
  return (
    typeof navigator === 'object' &&
    navigator !== null &&
    'connection' in navigator &&
    typeof navigator.connection === 'object' &&
    navigator.connection !== null &&
    'saveData' in navigator.connection &&
    navigator.connection.saveData === true
  );
}
