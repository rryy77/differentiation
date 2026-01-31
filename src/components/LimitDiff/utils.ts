import type { Point } from "./constants";

export const toPath = (pts: Point[]) =>
  pts.reduce(
    (d, [x, y], i) =>
      d + `${i === 0 ? "M" : " L"} ${x.toFixed(2)} ${y.toFixed(2)}`,
    "",
  );

export const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export const fmt = (n: number, d = 4) =>
  Number.isFinite(n) ? n.toFixed(d) : "NaN";
