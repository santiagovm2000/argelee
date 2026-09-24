// GENERATED FILE — do not edit by hand.
// Source: assets-src/images. Regenerate with `bun run images`.
//
// Usage:
//   <img [ngSrc]="images.heroProduct.path" [width]="..." [height]="..." priority />

export interface ResponsiveImage {
  readonly path: string;
  readonly social: string;
  readonly width: number;
  readonly height: number;
  readonly widths: readonly number[];
  readonly placeholder: string;
}

export const IMAGES = {
  brandWordmark: {
    path: 'images/brand/wordmark',
    social: 'images/brand/wordmark-social.jpg',
    width: 1200,
    height: 630,
    widths: [420, 640, 960],
    placeholder: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAABQAwCdASoUAAsAPu1iqU2ppaQiMAgBMB2JZwDKACHft1A6AAD+8cTYyUXzLeDNS5ohoAAA',
  },
  heroPoster: {
    path: 'images/hero/poster',
    social: 'images/hero/poster-social.jpg',
    width: 1280,
    height: 720,
    widths: [420, 640, 960, 1280],
    placeholder: 'data:image/webp;base64,UklGRpQAAABXRUJQVlA4IIgAAAAwBACdASoUAAsAPu1iqU2ppaOiMAgBMB2JZgCdMoACh4HSZIzqCQUxngAA/NEjSK/okn32Xf1MK3vyx6Yi6iVNknKWfdLmIXaE6iG+ZsNaX/uuPj1zngGY5vBKvR3yXgNBaSISGzDUoY56zVnAqnb6k8X8YYflv9RSJExZcoehxVON8YJmvgAA',
  },
} as const satisfies Record<string, ResponsiveImage>;

export type ImageKey = keyof typeof IMAGES;
