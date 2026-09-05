import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { take } from 'rxjs';
import { SITE } from '../config/app.constants';
import { DEPLOYMENT } from '../config/build-config.generated';
import { localizedUrl } from '../config/routes';
import { LANGUAGE_TAGS, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../i18n/i18n.constants';
import { LanguageService } from '../i18n/language.service';
import type { TranslationKey } from '../i18n/translation-keys.generated';
import { ALTERNATE_LINK_MARKER, JSON_LD_ID, OG_IMAGE_SIZE } from './seo.constants';

export interface ProductSeo {
  readonly nameKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  readonly lowPrice: number;
  readonly currency: string;
}

export interface PageSeo {
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  /** Interpolation values for title and description, given as keys and resolved once translations load. */
  readonly paramKeys?: Readonly<Record<string, TranslationKey>>;
  /** Path without the language prefix; the canonical and every alternate derive from it. */
  readonly segments?: readonly string[];
  /** Site-relative path of the social card (JPEG, OG_IMAGE_SIZE). */
  readonly image?: string;
  readonly product?: ProductSeo;
}

@Service()
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly transloco = inject(TranslocoService);
  private readonly language = inject(LanguageService);
  private readonly document = inject(DOCUMENT);

  /**
   * Writes localized title, description, canonical, hreflang, social tags and JSON-LD.
   * Waits for the active translation so the tags never carry a raw key: on the
   * client the locale file arrives over HTTP after the first render.
   */
  apply(seo: PageSeo): void {
    this.transloco
      .selectTranslation(this.language.current())
      .pipe(take(1))
      .subscribe(() => {
        this.write(seo);
      });
  }

  private write(seo: PageSeo): void {
    const segments = seo.segments ?? [];
    const active = this.language.current();
    const params = this.resolveParams(seo.paramKeys);
    const pageTitle = this.transloco.translate(seo.titleKey, params);
    const description = this.transloco.translate(seo.descriptionKey, params);
    const url = this.absolute(localizedUrl(active, segments));
    const image = seo.image === undefined ? undefined : this.absolute(seo.image);

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.setIndexability();

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
    this.setStructuredData(pageTitle, description, url, image, seo.product);
  }

  private resolveParams(
    paramKeys: Readonly<Record<string, TranslationKey>> | undefined,
  ): Record<string, string> {
    return Object.fromEntries(
      Object.entries(paramKeys ?? {}).map(([name, key]) => [name, this.transloco.translate(key)]),
    );
  }

  /** Prefixes the deployment origin, which may itself include a subpath. */
  private absolute(path: string): string {
    return `${DEPLOYMENT.origin}/${path.replace(/^\/+/, '')}`;
  }

  /**
   * Keeps preview deployments out of the index. A public preview that gets crawled
   * competes with the real domain as duplicate content, and the temporary URL can
   * outrank it.
   */
  private setIndexability(): void {
    if (DEPLOYMENT.indexable) {
      this.meta.removeTag("name='robots'");
      return;
    }
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
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

  /** Publishes Organization, WebSite and WebPage entities, plus a Product on product pages. */
  private setStructuredData(
    pageTitle: string,
    description: string,
    url: string,
    image: string | undefined,
    product: ProductSeo | undefined,
  ): void {
    const existing = this.document.getElementById(JSON_LD_ID);
    existing?.remove();

    const organizationId = `${DEPLOYMENT.origin}/#organization`;
    const websiteId = `${DEPLOYMENT.origin}/#website`;
    const inLanguage = LANGUAGE_TAGS[this.language.current()];
    const graph: Record<string, unknown>[] = [
      { '@type': 'Organization', '@id': organizationId, name: SITE.name, url: DEPLOYMENT.origin },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: SITE.name,
        url: DEPLOYMENT.origin,
        publisher: { '@id': organizationId },
        inLanguage,
      },
      {
        '@type': 'WebPage',
        url,
        name: pageTitle,
        description,
        isPartOf: { '@id': websiteId },
        inLanguage,
        ...(image === undefined ? {} : { primaryImageOfPage: image }),
      },
    ];

    if (product !== undefined) {
      graph.push({
        '@type': 'Product',
        name: this.transloco.translate(product.nameKey),
        description: this.transloco.translate(product.descriptionKey),
        url,
        ...(image === undefined ? {} : { image }),
        brand: { '@id': organizationId },
        offers: {
          '@type': 'AggregateOffer',
          lowPrice: product.lowPrice,
          priceCurrency: product.currency,
          availability: 'https://schema.org/InStock',
        },
      });
    }

    const script = this.document.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
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
