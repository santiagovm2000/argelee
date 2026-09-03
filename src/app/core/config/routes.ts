export const ROUTE_PATHS = {
  home: '',
  notFound: '**',
} as const;

export const ROUTE_LINKS = {
  home: '/',
} as const;

export type RouteLink = (typeof ROUTE_LINKS)[keyof typeof ROUTE_LINKS];
