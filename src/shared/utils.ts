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

/** かな・全角数字を半角数字に変換（入力欄で使用） */
const FULL_TO_HALF: Record<string, string> = {
  "０": "0", "１": "1", "２": "2", "３": "3", "４": "4",
  "５": "5", "６": "6", "７": "7", "８": "8", "９": "9",
  "〇": "0", "一": "1", "二": "2", "三": "3", "四": "4",
  "五": "5", "六": "6", "七": "7", "八": "8", "九": "9",
  "－": "-", "．": ".",
};
export function normalizeNumberInput(str: string): string {
  return str.split("").map((c) => FULL_TO_HALF[c] ?? c).join("");
}

/** 数値入力の先頭の不要なゼロを除去（0123 → 123、0.5 はそのまま） */
export function stripLeadingZeros(str: string): string {
  return str.replace(/^(-?)0+(?=\d)/, "$1");
}
