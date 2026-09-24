import { CONTENT_TYPE, HEADER, HTTP_STATUS } from './http.constants';

/** A JSON response with the right content type; headers given here win over the default. */
export function json(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has(HEADER.contentType)) headers.set(HEADER.contentType, CONTENT_TYPE.json);
  return new Response(JSON.stringify(body), { ...init, headers });
}

/** The parsed JSON body, or undefined when there is none or it does not parse. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function methodNotAllowed(allowed: readonly string[]): Response {
  return new Response(null, {
    status: HTTP_STATUS.methodNotAllowed,
    headers: { [HEADER.allow]: allowed.join(', ') },
  });
}
