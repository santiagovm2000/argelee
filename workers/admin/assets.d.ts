// Text modules wrangler bundles for the Worker (see `rules` in admin/wrangler.jsonc).
declare module '*.svg' {
  const content: string;
  export default content;
}
