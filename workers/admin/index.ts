import { PHOTO_KEY_PREFIX } from '../../src/app/core/catalog/catalog.constants';
import { renderCatalogHtml } from '../../src/app/core/catalog/pdf/catalog-pdf';
import type { PublicCatalog } from '../../src/app/core/catalog/projection';
import { SITE } from '../../src/app/core/config/app.constants';
import { DEPLOYMENT } from '../../src/app/core/config/build-config.generated';
import { DEFAULT_LANGUAGE } from '../../src/app/core/i18n/i18n.constants';
import locale from '../../public/i18n/es.json';
import { HTTP_STATUS } from '../shared/http.constants';
import { json } from '../shared/http';
import {
  kvAdminStore,
  kvTextSlot,
  r2ObjectRemover,
  r2ObjectStore,
  r2ObjectWriter,
} from '../shared/cloudflare-stores';
import { adminSecurityHeaders } from '../shared/security-headers';
import { handlePhoto } from '../site/photos';
import {
  type Credentials,
  handleLogin,
  handleLogout,
  handleMe,
  type LoginLimiter,
  OPEN_LIMITER,
  requireCsrfHeader,
  requireSession,
} from './auth';
import { ADMIN_API } from '../shared/admin-api.constants';
import { handleAdminCatalog } from './catalog-api';
import { siteAssets } from './catalog-pdf.assets';
import {
  handleInstagramStatus,
  handlePublish,
  handleSlide,
  handleSlideUpload,
  sweepSlides,
} from './instagram-api';
import { graphInstagramClient, type InstagramClient, refreshedToken } from './instagram-client';
import { currentToken, renewToken } from './instagram-token';
import { SLIDE_KEY_PREFIX, TOKEN_KV_KEY } from './instagram.constants';
import { browserRenderingRenderer, handlePdf } from './pdf-job';
import { handlePhotoUpload } from './photos-api';
import { handleStatus } from './status';

/** Secrets set with `wrangler secret put`; absent from the generated types on a machine without .dev.vars. */
interface AdminSecrets {
  readonly ADMIN_USER: string;
  readonly ADMIN_PASSWORD_HASH: string;
  readonly SESSION_SECRET: string;
  readonly BROWSER_RENDERING_TOKEN?: string;
  readonly INSTAGRAM_ACCESS_TOKEN?: string;
}

type Env = AdminEnv & AdminSecrets;

const MUTATING_METHODS: readonly string[] = ['POST', 'PUT', 'DELETE'];

function credentialsOf(env: Env): Credentials {
  return {
    user: env.ADMIN_USER,
    passwordHash: env.ADMIN_PASSWORD_HASH,
    sessionSecret: env.SESSION_SECRET,
  };
}

/** The price list as HTML, fetching fonts and photos from the live site. */
function catalogHtml(catalog: PublicCatalog): string {
  return renderCatalogHtml({
    catalog,
    locale,
    language: DEFAULT_LANGUAGE,
    brand: SITE.wordmark,
    whatsappNumber: SITE.whatsappNumber,
    assets: siteAssets(DEPLOYMENT.origin, DEPLOYMENT.imageTransforms),
  });
}

function limiterOf(env: Env): LoginLimiter {
  const binding: RateLimit | undefined = env.LOGIN_LIMITER;
  return binding === undefined
    ? OPEN_LIMITER
    : { allow: async (key) => (await binding.limit({ key })).success };
}

/** The owner's Instagram token, or null while none has been set. */
function instagramSecretOf(env: Env): string | null {
  const secret = env.INSTAGRAM_ACCESS_TOKEN;
  return secret === undefined || secret === '' ? null : secret;
}

/** Instagram with the token in use, or null while the panel is not connected to an account. */
async function instagramOf(env: Env): Promise<InstagramClient | null> {
  const secret = instagramSecretOf(env);
  if (secret === null) return null;
  return graphInstagramClient(await currentToken(secret, kvTextSlot(env.CATALOG, TOKEN_KV_KEY)));
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** The weekly chores: a fresh Instagram token, and no slide left where a publication parked it. */
async function upkeep(env: Env): Promise<void> {
  const secret = instagramSecretOf(env);
  if (secret !== null) {
    await renewToken(secret, kvTextSlot(env.CATALOG, TOKEN_KV_KEY), refreshedToken);
  }
  await sweepSlides(r2ObjectRemover(env.MEDIA));
}

async function api(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const credentials = credentialsOf(env);

  if (url.pathname === ADMIN_API.login && request.method === 'POST') {
    return handleLogin(request, credentials, limiterOf(env));
  }
  if (url.pathname === ADMIN_API.logout && request.method === 'POST') return handleLogout();
  if (url.pathname === ADMIN_API.me) return handleMe(request, credentials);

  const denied = await requireSession(request, credentials);
  if (denied !== null) return denied;
  if (MUTATING_METHODS.includes(request.method)) {
    const forbidden = requireCsrfHeader(request);
    if (forbidden !== null) return forbidden;
  }

  if (url.pathname === ADMIN_API.catalog)
    return handleAdminCatalog(request, kvAdminStore(env.CATALOG));
  if (url.pathname === ADMIN_API.status) return handleStatus(kvAdminStore(env.CATALOG));
  if (url.pathname === ADMIN_API.pdf && request.method === 'POST') {
    const token = env.BROWSER_RENDERING_TOKEN;
    const renderer =
      token === undefined || token === ''
        ? null
        : browserRenderingRenderer(env.CF_ACCOUNT_ID, token);
    return handlePdf(kvAdminStore(env.CATALOG), r2ObjectWriter(env.MEDIA), renderer, catalogHtml);
  }
  if (url.pathname === ADMIN_API.instagram) return handleInstagramStatus(await instagramOf(env));
  if (url.pathname === ADMIN_API.instagramPublish) {
    return handlePublish(request, {
      client: await instagramOf(env),
      slides: r2ObjectRemover(env.MEDIA),
      origin: url.origin,
      wait: pause,
    });
  }
  if (url.pathname.startsWith(ADMIN_API.instagramSlides)) {
    const name = url.pathname.slice(ADMIN_API.instagramSlides.length);
    return handleSlideUpload(request, name, r2ObjectWriter(env.MEDIA));
  }
  if (url.pathname.startsWith(ADMIN_API.photos)) {
    const key = `${PHOTO_KEY_PREFIX}${url.pathname.slice(ADMIN_API.photos.length)}`;
    return handlePhotoUpload(request, key, r2ObjectWriter(env.MEDIA));
  }
  return json({ error: 'not-found' }, { status: HTTP_STATUS.notFound });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return adminSecurityHeaders(await api(request, env));
    if (url.pathname.startsWith(`/${PHOTO_KEY_PREFIX}`)) {
      return adminSecurityHeaders(
        await handlePhoto(request, url.pathname.slice(1), r2ObjectStore(env.MEDIA)),
      );
    }
    if (url.pathname.startsWith(`/${SLIDE_KEY_PREFIX}`)) {
      return adminSecurityHeaders(
        await handleSlide(request, url.pathname.slice(1), r2ObjectStore(env.MEDIA)),
      );
    }
    return adminSecurityHeaders(await env.ASSETS.fetch(request));
  },
  scheduled(_controller, env, ctx): void {
    ctx.waitUntil(upkeep(env));
  },
} satisfies ExportedHandler<Env>;
