import { T } from '../i18n/translation-keys.generated';

// The order conditions, grouped the way a customer meets them: the piece
// itself, reserving and paying for it, then receiving it. The landing section
// and the printed catalogue both read this list, so they cannot drift apart.
// The copy lives in public/i18n/<lang>.json under landing.orders.
const notes = T.landing.orders.notes;
const titles = T.landing.orders.groups;

export const ORDER_CONDITION_GROUPS = [
  {
    id: 'piece',
    titleKey: titles.piece,
    noteKeys: [notes.fruit, notes.flavours, notes.availability],
  },
  {
    id: 'payment',
    titleKey: titles.payment,
    noteKeys: [notes.notice, notes.deposit, notes.receipt, notes.currency],
  },
  {
    id: 'delivery',
    titleKey: titles.delivery,
    noteKeys: [notes.delivery, notes.deliveryFee, notes.deliveryArea],
  },
] as const;

export type OrderConditionGroupId = (typeof ORDER_CONDITION_GROUPS)[number]['id'];
