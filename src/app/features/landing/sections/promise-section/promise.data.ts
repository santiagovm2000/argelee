import { T } from '../../../../core/i18n/translation-keys.generated';

/** The three things the brand promises every host, in the brand book's own order. */
export const PROMISE_VALUES = [
  {
    id: 'punctuality',
    titleKey: T.landing.promise.values.punctuality.title,
    bodyKey: T.landing.promise.values.punctuality.body,
  },
  {
    id: 'organization',
    titleKey: T.landing.promise.values.organization.title,
    bodyKey: T.landing.promise.values.organization.body,
  },
  {
    id: 'quality',
    titleKey: T.landing.promise.values.quality.title,
    bodyKey: T.landing.promise.values.quality.body,
  },
] as const;
