import type { FlavourId, FruitId } from '@core/catalog/catalog.model';
import { FLAVOUR_IDS, FRUIT_IDS } from '@core/catalog/choices';
import siteLocale from '@locales/es.json';
import { choiceIconUrl } from '@shared/ui/icons/icons';
import type { ChoiceOption } from '@shared/ui/choice-list/choice-list';

// The flavour and fruit names are the site's own copy, bundled here so the
// panel shows exactly what a customer will read.
const FLAVOUR_NAMES: Readonly<Record<FlavourId, string>> = siteLocale.catalog.flavours;
const FRUIT_NAMES: Readonly<Record<FruitId, string>> = siteLocale.catalog.fruits;

export const FLAVOUR_CHOICES: readonly ChoiceOption<FlavourId>[] = FLAVOUR_IDS.map((id) => ({
  id,
  label: FLAVOUR_NAMES[id],
  icon: choiceIconUrl(id),
}));

export const FRUIT_CHOICES: readonly ChoiceOption<FruitId>[] = FRUIT_IDS.map((id) => ({
  id,
  label: FRUIT_NAMES[id],
  icon: choiceIconUrl(id),
}));
