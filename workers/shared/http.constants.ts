// What every Worker response is made of: statuses, header names and the
// caching each kind of response deserves.

export const HTTP_STATUS = {
  ok: 200,
  created: 201,
  noContent: 204,
  notModified: 304,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  methodNotAllowed: 405,
  preconditionFailed: 412,
  unprocessable: 422,
  payloadTooLarge: 413,
  tooManyRequests: 429,
  serviceUnavailable: 503,
} as const;

export const HEADER = {
  cacheControl: 'Cache-Control',
  contentType: 'Content-Type',
  etag: 'ETag',
  ifNoneMatch: 'If-None-Match',
  ifMatch: 'If-Match',
  allow: 'Allow',
  cookie: 'Cookie',
  setCookie: 'Set-Cookie',
  clientIp: 'CF-Connecting-IP',
  requestedWith: 'X-Requested-With',
  retryAfter: 'Retry-After',
  contentDisposition: 'Content-Disposition',
} as const;

export const CONTENT_TYPE = {
  json: 'application/json; charset=utf-8',
  html: 'text/html; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  binary: 'application/octet-stream',
} as const;

// The catalogue changes rarely and carries an ETag, so browsers may keep it a
// minute and revalidate cheaply; a photo's key is its content hash, so it never changes.
export const CACHE_CONTROL = {
  catalog: 'public, max-age=60',
  immutable: 'public, max-age=31536000, immutable',
  page: 'public, max-age=0, must-revalidate',
  private: 'no-store',
} as const;

export const READ_METHODS: readonly string[] = ['GET', 'HEAD'];

export const SITEMAP_PATH = '/sitemap.xml';
export const SHELL_ASSET_PATH = '/index.csr.html';
export const NOT_FOUND_ASSET_PATH = '/404.html';
