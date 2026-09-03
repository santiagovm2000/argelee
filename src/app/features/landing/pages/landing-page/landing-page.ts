import { Component, inject, type OnInit } from '@angular/core';
import { HeroSection } from '../../sections/hero-section/hero-section';
import { SeoService } from '../../../../core/seo/seo.service';
import { T } from '../../../../core/i18n/translation-keys.generated';
import { ROUTE_LINKS } from '../../../../core/config/routes';

@Component({
  selector: 'arg-landing-page',
  imports: [HeroSection],
  templateUrl: './landing-page.html',
})
export class LandingPage implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.apply({
      titleKey: T.meta.home.title,
      descriptionKey: T.meta.home.description,
      path: ROUTE_LINKS.home,
    });
  }
}
