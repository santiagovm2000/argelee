import { Component, inject, type OnInit } from '@angular/core';
import { IMAGES } from '../../../../core/images/image-manifest.generated';
import { T } from '../../../../core/i18n/translation-keys.generated';
import { SeoService } from '../../../../core/seo/seo.service';
import { CatalogSection } from '../../sections/catalog-section/catalog-section';
import { HeroSection } from '../../sections/hero-section/hero-section';
import { OrdersSection } from '../../sections/orders-section/orders-section';

@Component({
  selector: 'arg-landing-page',
  imports: [HeroSection, CatalogSection, OrdersSection],
  templateUrl: './landing-page.html',
})
export class LandingPage implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.apply({
      titleKey: T.meta.home.title,
      descriptionKey: T.meta.home.description,
      image: IMAGES.brandWordmark.social,
    });
  }
}
