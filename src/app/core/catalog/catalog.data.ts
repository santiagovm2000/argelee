import type { Product } from './catalog.model';

// The whole menu, in the order of the owner's price list. Add a piece here and
// its names in public/i18n/<lang>.json, run `bun run i18n`, and the shelf, the
// product page and the sitemap pick it up. `size: null` sells the piece by the
// unit: the configurator asks how many, and `price` is the price of one. A
// group listed as `null` is simply absent from the configurator; the layers or
// fruit in `defaults` are included in the price.
export const PRODUCTS: readonly Product[] = [
  {
    id: 'frutas-en-capa-cristalina',
    image: 'catalogFruitCrystalLayer',
    price: 60,
    size: { litres: 2, serves: [16, 20] },
    layers: null,
    fruits: null,
  },
  {
    id: 'fresa-a-franjas',
    image: 'catalogStrawberryStripes',
    price: 45,
    size: { litres: 2, serves: [16, 20] },
    layers: null,
    fruits: null,
  },
  {
    id: 'anillo-de-cereza-y-tres-leches',
    image: 'catalogCherryTresLechesRing',
    price: 35,
    size: { litres: 2, serves: [16, 20] },
    layers: null,
    fruits: null,
  },
  {
    id: 'uva-a-dos-tonos',
    image: 'catalogTwoToneGrape',
    price: 30,
    size: { litres: 2, serves: [16, 20] },
    layers: null,
    fruits: null,
  },
  {
    id: 'fresa-con-cubitos',
    image: 'catalogStrawberryCubes',
    price: 30,
    size: { litres: 1.6, serves: [13, 16] },
    layers: null,
    fruits: null,
  },
  {
    id: 'cereza-y-leche-condensada',
    image: 'catalogCherryCondensedMilk',
    price: 20,
    size: { litres: 1, serves: [8, 10] },
    layers: null,
    fruits: null,
  },
  {
    id: 'fresa-en-envase-individual',
    image: 'catalogStrawberryCup',
    price: 3.5,
    size: null,
    layers: null,
    fruits: null,
  },
];
