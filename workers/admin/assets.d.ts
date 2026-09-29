// Modules wrangler bundles for the Worker (see `rules` in admin/wrangler.jsonc):
// SVG as text, fonts as bytes.
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.woff2' {
  const content: ArrayBuffer;
  export default content;
}
