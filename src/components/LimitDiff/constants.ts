export type FnType = "x2" | "x3";

export const FUNCTIONS = {
  x2: { f: (x: number) => x * x, df: (x: number) => 2 * x },
  x3: { f: (x: number) => x * x * x, df: (x: number) => 3 * x * x },
} as const;

export type Point = [number, number];

export const EPS = 1e-6;

export const LAYOUT = {
  W: 780,
  H1: 290,
  H2: 220,
  pad: 52,
  xMin: -3,
  xMax: 3,
} as const;
