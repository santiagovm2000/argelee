/** One sunflower in an arrangement: its box in the arrangement's units and its turn in degrees. */
export interface Flower {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly turn: number;
}

/** A handful of sunflowers laid out the way the brand's stationery scatters them. */
export interface Arrangement {
  readonly width: number;
  readonly height: number;
  readonly flowers: readonly Flower[];
}

export const ARRANGEMENTS = {
  pair: {
    width: 300,
    height: 270,
    flowers: [
      { x: 105, y: 0, size: 190, turn: 18 },
      { x: 0, y: 140, size: 125, turn: -14 },
    ],
  },
  trio: {
    width: 320,
    height: 320,
    flowers: [
      { x: 0, y: 30, size: 170, turn: 24 },
      { x: 150, y: 0, size: 120, turn: -10 },
      { x: 120, y: 150, size: 160, turn: 6 },
    ],
  },
  column: {
    width: 260,
    height: 560,
    flowers: [
      { x: 20, y: 0, size: 150, turn: 12 },
      { x: 110, y: 105, size: 140, turn: -22 },
      { x: 0, y: 200, size: 170, turn: 28 },
      { x: 120, y: 320, size: 130, turn: -6 },
      { x: 10, y: 400, size: 160, turn: 16 },
    ],
  },
} as const satisfies Record<string, Arrangement>;

export type ArrangementName = keyof typeof ARRANGEMENTS;
