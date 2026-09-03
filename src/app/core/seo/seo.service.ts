import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { SITE } from '../config/app.constants';
import { localizedUrl } from '../config/routes';
import { LANGUAGE_TAGS, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../i18n/i18n.constants';
import { LanguageService } from '../i18n/language.service';
import type { TranslationKey } from '../i18n/translation-keys.generated';
import { ALTERNATE_LINK_MARKER, JSON_LD_ID, OG_IMAGE_SIZE } from './seo.constants';

export interface PageSeo {
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  readonly segments?: readonly string[];
  readonly image?: string;
}

@Service()
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly transloco = inject(TranslocoService);
  private readonly language = inject(LanguageService);
  private readonly document = inject(DOCUMENT);

  /** Writes localized title, description, canonical, hreflang, social tags and JSON-LD. */
  apply(seo: PageSeo): void {
    const segments = seo.segments ?? [];
    const active = this.language.current();
    const pageTitle = this.transloco.translate(seo.titleKey);
    const description = this.transloco.translate(seo.descriptionKey);
    const url = this.absolute(localizedUrl(active, segments));
    const image = seo.image === undefined ? undefined : this.absolute(seo.image);

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });

    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE.name });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({
      property: 'og:locale',
      content: LANGUAGE_TAGS[active].replace('-', '_'),
    });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:site', content: SITE.twitterHandle });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    if (image !== undefined) {
      this.meta.updateTag({ property: 'og:image', content: image });
      this.meta.updateTag({ property: 'og:image:width', content: String(OG_IMAGE_SIZE.width) });
      this.meta.updateTag({ property: 'og:image:height', content: String(OG_IMAGE_SIZE.height) });
      this.meta.updateTag({ name: 'twitter:image', content: image });
    }

    this.setCanonical(url);
    this.setAlternates(segments);
    this.setStructuredData(pageTitle, description, url);
  }

  private absolute(path: string): string {
    return `${SITE.origin}${path}`;
  }

  /** Tells search engines which URL is authoritative for this page. */
  private setCanonical(url: string): void {
    this.upsertLink('canonical', { rel: 'canonical', href: url });
  }

  /**
   * Emits one hreflang link per language plus x-default. Without these, only the
   * default-language URL gets indexed and the translations are treated as duplicates.
   */
  private setAlternates(segments: readonly string[]): void {
    for (const stale of this.document.head.querySelectorAll(`link[${ALTERNATE_LINK_MARKER}]`)) {
      stale.remove();
    }

    const alternateLocales: string[] = [];
    for (const language of SUPPORTED_LANGUAGES) {
      const href = this.absolute(localizedUrl(language, segments));
      this.appendLink({ rel: 'alternate', hreflang: language, href });
      if (language !== this.language.current()) {
        alternateLocales.push(LANGUAGE_TAGS[language].replace('-', '_'));
      }
    }
    this.appendLink({
      rel: 'alternate',
      hreflang: 'x-default',
      href: this.absolute(localizedUrl(DEFAULT_LANGUAGE, segments)),
    });

    this.meta.removeTag("property='og:locale:alternate'");
    for (const locale of alternateLocales) {
      this.meta.addTag({ property: 'og:locale:alternate', content: locale });
    }
  }

  /** Publishes Organization and WebSite entities so results can show a rich snippet. */
  private setStructuredData(pageTitle: string, description: string, url: string): void {
    const existing = this.document.getElementById(JSON_LD_ID);
    existing?.remove();

    const script = this.document.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE.origin}/#organization`,
          name: SITE.name,
          url: SITE.origin,
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE.origin}/#website`,
          name: SITE.name,
          url: SITE.origin,
          publisher: { '@id': `${SITE.origin}/#organization` },
          inLanguage: LANGUAGE_TAGS[this.language.current()],
        },
        {
          '@type': 'WebPage',
          url,
          name: pageTitle,
          description,
          isPartOf: { '@id': `${SITE.origin}/#website` },
          inLanguage: LANGUAGE_TAGS[this.language.current()],
        },
      ],
    });
    this.document.head.appendChild(script);
  }

  private upsertLink(rel: string, attributes: Record<string, string>): void {
    const existing = this.document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    existing?.remove();
    this.appendLink(attributes);
  }

  private appendLink(attributes: Record<string, string>): void {
    const link = this.document.createElement('link');
    for (const [name, value] of Object.entries(attributes)) {
      link.setAttribute(name, value);
    }
    if (attributes['rel'] === 'alternate') link.setAttribute(ALTERNATE_LINK_MARKER, '');
    this.document.head.appendChild(link);
  }
}
