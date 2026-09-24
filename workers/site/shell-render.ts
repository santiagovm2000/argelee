import { LANGUAGE_TAGS } from '../../src/app/core/i18n/i18n.constants';
import { CACHE_CONTROL, HEADER, HTTP_STATUS } from '../shared/http.constants';
import { type ShellMeta, shellHeadTags } from './product-shell';

// The one place that touches HTMLRewriter, a workerd global, kept apart from
// the pure meta computation so that can be unit-tested outside the runtime.

/** Streams the client shell with the piece's head written in and a 200, since the piece exists. */
export function renderProductShell(shell: Response, meta: ShellMeta): Response {
  const rewritten = new HTMLRewriter()
    .on('html', {
      element(element) {
        element.setAttribute('lang', LANGUAGE_TAGS[meta.language]);
      },
    })
    .on('title', {
      element(element) {
        element.setInnerContent(meta.title);
      },
    })
    .on('head', {
      element(element) {
        element.append(shellHeadTags(meta), { html: true });
      },
    })
    .transform(shell);
  const response = new Response(rewritten.body, {
    status: HTTP_STATUS.ok,
    headers: rewritten.headers,
  });
  response.headers.set(HEADER.cacheControl, CACHE_CONTROL.page);
  return response;
}
