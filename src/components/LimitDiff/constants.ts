import { LAYOUT, type Point } from "../../shared";

export type FnType = "x2" | "x3" | "x4";

export const FUNCTIONS = {
  x2: { f: (x: number) => x * x, df: (x: number) => 2 * x },
  x3: { f: (x: number) => x * x * x, df: (x: number) => 3 * x * x },
  x4: { f: (x: number) => x * x * x * x, df: (x: number) => 4 * x * x * x },
} as const;

export type { Point };
export { LAYOUT };

export const EPS = 1e-6;
