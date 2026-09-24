export const ADMIN_API = {
  login: '/api/login',
  logout: '/api/logout',
  me: '/api/me',
  catalog: '/api/catalog',
  status: '/api/status',
  photos: '/api/photos/',
  pdf: '/api/pdf',
} as const;

export const CSRF_HEADER_NAME = 'X-Requested-With';
export const CSRF_HEADER_VALUE = 'admin';
