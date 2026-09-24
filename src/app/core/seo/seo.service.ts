import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { take } from 'rxjs';
import { SITE } from '../config/app.constants';
import { DEPLOYMENT } from '../config/build-config.generated';
import { localizedUrl } from '../config/routes';
import { LANGUAGE_TAGS } from '../i18n/i18n.constants';
import { LanguageService } from '../i18n/language.service';
import type { TranslationKey } from '../i18n/translation-keys.generated';
import { JSON_LD_ID, OG_IMAGE_SIZE } from './seo.constants';

export interface ProductSeo {
  readonly name: string;
  readonly description: string;
  readonly lowPrice: number;
  readonly currency: string;
}

export interface PageSeo {
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  /** Interpolation values for title and description, given as keys and resolved once translations load. */
  readonly paramKeys?: Readonly<Record<string, TranslationKey>>;
  /** Interpolation values already in the visitor's language: catalogue text, which is data, not locale copy. */
  readonly params?: Readonly<Record<string, string>>;
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
   * Writes the title, description, canonical, social tags and JSON-LD.
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
    const params = { ...this.resolveParams(seo.paramKeys), ...seo.params };
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
        name: product.name,
        description: product.description,
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
    this.document.head.appendChild(link);
  }
}
