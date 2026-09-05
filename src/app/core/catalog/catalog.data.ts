import type { Product } from './catalog.model';

// The whole menu, in shelf order. Add a piece here and its names in
// public/i18n/<lang>.json, run `bun run i18n`, and the shelf, the product page
// and the sitemap pick it up. A group listed as `null` is simply absent from the
// configurator; the layers or fruit in `defaults` are included in the base price.
export const PRODUCTS: readonly Product[] = [
  {
    id: 'jardin-de-frutas',
    image: 'catalogTropicalFruitRing',
    basePrice: 18,
    portions: [8, 12, 16],
    layers: null,
    fruits: {
      options: ['fresa', 'uva', 'durazno', 'kiwi', 'mango', 'pina'],
      defaults: ['fresa', 'uva'],
    },
  },
  {
    id: 'mosaico-fresa-crema',
    image: 'catalogStrawberryMilkFlower',
    basePrice: 15,
    portions: [8, 12, 16],
    layers: {
      options: ['fresa', 'crema', 'durazno', 'maracuya', 'limon'],
      defaults: ['fresa', 'crema'],
    },
    fruits: null,
  },
  {
    id: 'uva-nocturna',
    image: 'catalogGrapeBundt',
    basePrice: 16,
    portions: [8, 12, 16],
    layers: { options: ['uva', 'leche', 'vainilla', 'mora'], defaults: ['uva', 'leche'] },
    fruits: null,
  },
  {
    id: 'rubi-clasica',
    image: 'catalogStrawberryScalloped',
    basePrice: 12,
    portions: [8, 12, 16],
    layers: {
      options: ['frutos-rojos', 'fresa', 'cereza', 'granadilla'],
      defaults: ['frutos-rojos'],
    },
    fruits: null,
  },
  {
    id: 'capas-de-fresa',
    image: 'catalogStrawberrySheet',
    basePrice: 17,
    portions: [8, 12, 16],
    layers: {
      options: ['fresa', 'crema', 'limon', 'durazno', 'coco'],
      defaults: ['fresa', 'crema'],
    },
    fruits: { options: ['fresa', 'kiwi', 'uva', 'durazno'], defaults: ['fresa'] },
  },
];
