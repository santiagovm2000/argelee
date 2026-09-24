import { localizedText } from '../../src/app/core/catalog/localized-text';
import type { PublicCatalog } from '../../src/app/core/catalog/projection';
import { SITE } from '../../src/app/core/config/app.constants';
import {
  localizedUrl,
  pathSegments,
  productSegments,
  ROUTE_PATHS,
} from '../../src/app/core/config/routes';
import { DEFAULT_LANGUAGE, type SupportedLanguage } from '../../src/app/core/i18n/i18n.constants';
import { photoSocialUrl } from '../../src/app/core/images/photo';
import { OG_IMAGE_SIZE } from '../../src/app/core/seo/seo.constants';
import es from '../../public/i18n/es.json';

// A piece published after the last build has no prerendered page. The Worker
// answers its URL with the client shell so the app renders it, and writes the
// page's title, description and social tags into the shell's head so a crawler
// or a link preview sees the piece, not a blank template.

const PRODUCT_SEGMENT_COUNT = 2;

export interface ShellMeta {
  readonly language: SupportedLanguage;
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly image: string;
}

function interpolate(template: string, params: Readonly<Record<string, string>>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => params[name] ?? match);
}

/** The head of the product page a URL asks for, or null when it is not a published piece. */
export function productShellMeta(
  url: URL,
  origin: string,
  catalog: PublicCatalog,
  transforms: boolean,
): ShellMeta | null {
  const segments = pathSegments(url.pathname);
  if (segments.length !== PRODUCT_SEGMENT_COUNT || segments[0] !== ROUTE_PATHS.catalog) return null;
  const product = catalog.products.find((candidate) => candidate.id === segments[1]);
  if (product === undefined) return null;

  const language: SupportedLanguage = DEFAULT_LANGUAGE;
  const text = localizedText(product.text, language);
  const locale = es;
  const absolute = (path: string): string => `${origin}/${path.replace(/^\/+/, '')}`;
  const pageSegments = productSegments(product.id);

  return {
    language,
    title: interpolate(locale.meta.product.title, { name: text.name }),
    description: interpolate(locale.meta.product.description, { description: text.description }),
    canonical: absolute(localizedUrl(language, pageSegments)),
    image: absolute(photoSocialUrl(product.photo.key, transforms)),
  };
}

function attribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** The tags the client would set once booted, so the shell already carries them. */
export function shellHeadTags(meta: ShellMeta): string {
  const tag = (name: string, attributes: Readonly<Record<string, string>>): string =>
    `<${name} ${Object.entries(attributes)
      .map(([key, value]) => `${key}="${attribute(value)}"`)
      .join(' ')}>`;
  return [
    tag('meta', { name: 'description', content: meta.description }),
    tag('link', { rel: 'canonical', href: meta.canonical }),
    tag('meta', { property: 'og:type', content: 'website' }),
    tag('meta', { property: 'og:site_name', content: SITE.name }),
    tag('meta', { property: 'og:title', content: meta.title }),
    tag('meta', { property: 'og:description', content: meta.description }),
    tag('meta', { property: 'og:url', content: meta.canonical }),
    tag('meta', { property: 'og:image', content: meta.image }),
    tag('meta', { property: 'og:image:width', content: String(OG_IMAGE_SIZE.width) }),
    tag('meta', { property: 'og:image:height', content: String(OG_IMAGE_SIZE.height) }),
    tag('meta', { name: 'twitter:card', content: 'summary_large_image' }),
    tag('meta', { name: 'twitter:title', content: meta.title }),
    tag('meta', { name: 'twitter:description', content: meta.description }),
    tag('meta', { name: 'twitter:image', content: meta.image }),
  ].join('');
}
