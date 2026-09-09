import type { Product } from './catalog.model';

// The whole menu, in the order of the owner's price list. Add a piece here and
// its names in public/i18n/<lang>.json, run `bun run i18n`, and the shelf, the
// product page and the sitemap pick it up. `serves: null` sells the piece by
// the unit: the configurator asks how many, and `price` is the price of one.
//
// Flavours and fruit follow the owner's "frutas y sabores por pieza" sheet:
// what each piece admits, and how many choices it takes. A group listed as
// `null` is simply absent from the configurator. Every choice is included in
// the price; the defaults are what the photo shows. A group that takes several
// choices may be left empty; one that takes a single choice always has one. The
// sheet fixes the Napolitana at three stripes; the other maximums follow what
// fits the mould.
const ONE_CHOICE = 1;
const OPTIONAL = 0;

export const PRODUCTS: readonly Product[] = [
  {
    id: 'encapsulada-de-frutas',
    image: 'catalogFruitCrystalLayer',
    price: 60,
    serves: [16, 20],
    flavours: {
      options: ['fresa', 'cereza', 'frambuesa', 'limon', 'pina', 'uva'],
      defaults: ['fresa'],
      min: OPTIONAL,
      max: 3,
    },
    fruits: {
      options: [
        'fresa',
        'uva',
        'melocoton',
        'mango',
        'mora',
        'arandano',
        'cereza',
        'mandarina',
        'pina',
      ],
      defaults: ['fresa', 'uva', 'melocoton'],
      min: OPTIONAL,
      max: 4,
    },
  },
  {
    id: 'napolitana-de-frutas',
    image: 'catalogStrawberryStripes',
    price: 45,
    serves: [16, 20],
    flavours: {
      options: ['fresa', 'cereza', 'frambuesa', 'limon', 'pina', 'uva', 'tutti-frutti'],
      defaults: ['fresa', 'limon', 'pina'],
      min: OPTIONAL,
      max: 3,
    },
    fruits: {
      options: ['fresa', 'melocoton', 'mango', 'uva', 'mora'],
      defaults: ['fresa'],
      min: OPTIONAL,
      max: 2,
    },
  },
  {
    id: 'corona-tres-leches',
    image: 'catalogCherryTresLechesRing',
    price: 35,
    serves: [16, 20],
    flavours: {
      options: ['cereza', 'fresa', 'frambuesa', 'uva', 'limon', 'pina', 'tutti-frutti'],
      defaults: ['fresa'],
      min: ONE_CHOICE,
      max: ONE_CHOICE,
    },
    fruits: {
      options: ['fresa', 'uva', 'cereza'],
      defaults: [],
      min: OPTIONAL,
      max: 2,
    },
  },
  {
    id: 'bicolor-coronada',
    image: 'catalogTwoToneGrape',
    price: 30,
    serves: [16, 20],
    flavours: {
      options: ['uva', 'fresa', 'cereza', 'frambuesa', 'pina', 'limon'],
      defaults: ['uva'],
      min: ONE_CHOICE,
      max: ONE_CHOICE,
    },
    fruits: {
      options: ['uva', 'fresa', 'cereza', 'mora', 'arandano', 'mandarina'],
      defaults: ['uva'],
      min: OPTIONAL,
      max: 2,
    },
  },
  {
    id: 'mosaico-de-fruta-fresca',
    image: 'catalogStrawberryCubes',
    price: 30,
    serves: [13, 16],
    flavours: {
      options: ['fresa', 'cereza', 'frambuesa', 'uva', 'pina', 'tutti-frutti'],
      defaults: ['fresa'],
      min: ONE_CHOICE,
      max: ONE_CHOICE,
    },
    fruits: {
      options: ['fresa', 'melocoton', 'uva', 'mango', 'mora', 'arandano', 'pina'],
      defaults: ['fresa'],
      min: OPTIONAL,
      max: 3,
    },
  },
  {
    id: 'cristal-y-crema',
    image: 'catalogCherryCondensedMilk',
    price: 20,
    serves: [8, 10],
    flavours: {
      options: ['cereza', 'fresa', 'frambuesa', 'uva', 'limon', 'pina', 'tutti-frutti'],
      defaults: ['fresa'],
      min: ONE_CHOICE,
      max: ONE_CHOICE,
    },
    fruits: null,
  },
  {
    id: 'porcion-individual',
    image: 'catalogStrawberryCup',
    price: 3.5,
    serves: null,
    flavours: {
      options: ['fresa', 'cereza', 'frambuesa', 'uva', 'pina', 'limon'],
      defaults: ['fresa'],
      min: ONE_CHOICE,
      max: ONE_CHOICE,
    },
    fruits: {
      options: ['fresa', 'uva', 'melocoton', 'mora', 'arandano', 'mango'],
      defaults: ['fresa'],
      min: OPTIONAL,
      max: 2,
    },
  },
];
