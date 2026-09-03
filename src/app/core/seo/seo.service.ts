import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { SITE } from '../config/app.constants';
import { LanguageService } from '../i18n/language.service';
import type { TranslationKey } from '../i18n/translation-keys.generated';

export interface PageSeo {
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  readonly path: string;
  readonly image?: string;
}

@Service()
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly transloco = inject(TranslocoService);
  private readonly language = inject(LanguageService);
  private readonly document = inject(DOCUMENT);

  /** Writes localized title, description, canonical and social tags for a page. */
  apply(seo: PageSeo): void {
    const pageTitle = this.transloco.translate(seo.titleKey);
    const description = this.transloco.translate(seo.descriptionKey);
    const url = `${SITE.origin}${seo.path}`;
    const image = seo.image === undefined ? undefined : `${SITE.origin}${seo.image}`;

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });

    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE.name });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:locale', content: this.language.currentTag() });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:site', content: SITE.twitterHandle });

    if (image !== undefined) {
      this.meta.updateTag({ property: 'og:image', content: image });
      this.meta.updateTag({ name: 'twitter:image', content: image });
    }

    this.setCanonical(url);
  }

  /** Adds or updates the canonical link in <head>. */
  private setCanonical(url: string): void {
    const existing = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (existing != null) {
      existing.href = url;
      return;
    }
    const link = this.document.createElement('link');
    link.rel = 'canonical';
    link.href = url;
    this.document.head.appendChild(link);
  }
}
