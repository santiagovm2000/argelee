// Served as-is from public/video. Paths are relative so they resolve against
// <base href> and keep working under a subpath deployment.
export const HERO_VIDEO = {
  webm: 'video/hero.webm',
  mp4: 'video/hero.mp4',
} as const;

// The video starts once the browser is idle after the first paint, or after
// this long at the latest, so the poster wins the first bytes on a slow line.
export const HERO_VIDEO_START_TIMEOUT_MS = 2500;
