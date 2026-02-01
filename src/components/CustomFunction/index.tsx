import React, { useEffect, useMemo, useState } from "react";
import { create, all } from "mathjs";
import {
  LAYOUT,
  toPath,
  GridLines,
  strokeGrid,
  strokeAxis,
  colors,
  fmt,
  normalizeNumberInput,
  stripLeadingZeros,
  FormulaText,
} from "../../shared";

const math = create(all);
const { W, H1, H2, pad } = LAYOUT;
const BASE_X_MIN = LAYOUT.xMin;
const BASE_X_MAX = LAYOUT.xMax;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;

type TermType = "x4" | "x3" | "x2" | "x" | "const";

type Term = {
  type: TermType;
  coef: number;
  coefStr?: string; // 分数や√の表示用（例: "1/3", "√2"）
};

const TERM_BUTTONS: { type: TermType; label: string }[] = [
  { type: "x4", label: "x⁴" },
  { type: "x3", label: "x³" },
  { type: "x2", label: "x²" },
  { type: "x", label: "x" },
  { type: "const", label: "定数項" },
];

/** mathjs 用の式（coefStr があれば分数・√をそのまま使う） */
function termToExprPart(t: Term): string {
  if (t.coef === 0) return "";
  const coefPart = t.coefStr
    ? t.coefStr.includes("√")
      ? toMathJsFormat(t.coefStr)
      : t.coefStr
    : String(t.coef);
  if (t.type === "const") return coefPart;
  const base =
    t.type === "x4"
      ? "x^4"
      : t.type === "x3"
      ? "x^3"
      : t.type === "x2"
      ? "x^2"
      : "x";
  if (coefPart === "1") return base;
  if (coefPart === "-1") return `-${base}`;
  return `${coefPart}*${base}`;
}

function termsToExpr(terms: Term[]): string {
  const parts = terms
    .filter((t) => t.coef !== 0)
    .map(termToExprPart)
    .filter(Boolean);
  if (parts.length === 0) return "0";
  return parts.join(" + ").replace(/\s\+\s-/g, " - ");
}

/** 表示用：* ^ を使わず x⁴ x³ x² などで表示（分数は後で FormulaText で縦書き表示） */
function termToDisplayPart(t: Term): string {
  if (t.coef === 0) return "";
  const coefDisplay = t.coefStr || String(t.coef);
  if (t.type === "const") return coefDisplay;
  const base =
    t.type === "x4"
      ? "x⁴"
      : t.type === "x3"
      ? "x³"
      : t.type === "x2"
      ? "x²"
      : "x";
  if (t.coef === 1 && !t.coefStr) return base;
  if (t.coef === -1 && !t.coefStr) return `-${base}`;
  return `${coefDisplay}${base}`;
}

function termsToDisplayString(terms: Term[]): string {
  const parts = terms
    .filter((t) => t.coef !== 0)
    .map(termToDisplayPart)
    .filter(Boolean);
  if (parts.length === 0) return "0";
  return parts.join(" + ").replace(/\s\+\s-/g, " - ");
}

/** f'(x) の表示用：* と ^ を除去、sqrt(n)→√n（分数は FormulaText で縦書き表示） */
function derivativeToDisplay(str: string): string {
  return str
    .replace(/\*/g, "")
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\^4/g, "⁴")
    .replace(/sqrt\((\d+)\)/g, "√$1");
}

const DESC_ORDER: TermType[] = ["x4", "x3", "x2", "x", "const"];

/** √n を簡約形で返す（√8 → "2√2"、√5 → "√5"、√4 → "2"） */
function simplifySquareRoot(n: number): string {
  if (n < 0 || !Number.isFinite(n)) return "";
  if (n === 0) return "0";
  if (!Number.isInteger(n)) {
    const r = Math.sqrt(n);
    return Number.isInteger(r) ? String(r) : r.toFixed(4).replace(/\.?0+$/, "");
  }
  let a = 1;
  for (let i = Math.floor(Math.sqrt(n)); i > 1; i--) {
    if (n % (i * i) === 0) {
      a = i;
      break;
    }
  }
  const b = n / (a * a);
  if (b === 1) return String(a);
  if (a === 1) return `√${n}`;
  return `${a}√${b}`;
}

/** "2√2" → "2*sqrt(2)"、"√5" → "sqrt(5)" に変換して mathjs で評価可能に */
function toMathJsFormat(s: string): string {
  return s.replace(/(-?\d*)√(\d+)/g, (_, a, b) => {
    if (a === "" || a === "-") return `${a}sqrt(${b})`;
    return `${a}*sqrt(${b})`;
  });
}

function mergeAndSortTerms(terms: Term[]): Term[] {
  const byType: Record<TermType, { coef: number; coefStr?: string; nonzeroCount: number }> = {
    x4: { coef: 0, nonzeroCount: 0 },
    x3: { coef: 0, nonzeroCount: 0 },
    x2: { coef: 0, nonzeroCount: 0 },
    x: { coef: 0, nonzeroCount: 0 },
    const: { coef: 0, nonzeroCount: 0 },
  };
  for (const t of terms) {
    byType[t.type].coef += t.coef;
    if (t.coef !== 0) {
      byType[t.type].nonzeroCount += 1;
      if (t.coefStr !== undefined) {
        byType[t.type].coefStr = t.coefStr;
      }
    }
  }
  return DESC_ORDER.filter((type) => byType[type].coef !== 0).map((type) => {
    const { coef, coefStr, nonzeroCount } = byType[type];
    // その型の非零項が1つだけのとき coefStr を表示に使う
    return { type, coef, coefStr: nonzeroCount === 1 ? coefStr : undefined };
  });
}

type ParsedState =
  | {
      ok: true;
      f: (x: number) => number;
      df: (x: number) => number;
      dfStr: string;
    }
  | { ok: false; error: string };

function parseExpr(exprString: string): ParsedState {
  const trimmed = exprString.trim();
  if (!trimmed) return { ok: false, error: "式を入力してください" };
  try {
    const node = math.parse(trimmed);
    const derivNode = math.derivative(node, "x");
    const dfStr = derivNode.toString();
    const f = (x: number) => (node.evaluate({ x }) as number) ?? NaN;
    const df = (x: number) => (derivNode.evaluate({ x }) as number) ?? NaN;
    return { ok: true, f, df, dfStr };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

export default function CustomFunction() {
  const [terms, setTerms] = useState<Term[]>([{ type: "x2", coef: 0 }]);
  const [pendingTerm, setPendingTerm] = useState<TermType | null>(null);
  const [pendingCoef, setPendingCoef] = useState("");
  const [xValue, setXValue] = useState(0.6);
  const [xInputStr, setXInputStr] = useState("0.6");
  const [zoom, setZoom] = useState(1);

  const xMin = BASE_X_MIN / zoom;
  const xMax = BASE_X_MAX / zoom;

  useEffect(() => {
    setXValue((v) => {
      const c = Math.max(xMin, Math.min(xMax, v));
      setXInputStr(c.toFixed(1));
      return c;
    });
  }, [xMin, xMax]);

  const exprString = useMemo(() => termsToExpr(terms), [terms]);
  const parsed = useMemo(() => parseExpr(exprString), [exprString]);

  const addTerm = () => {
    if (pendingTerm === null) return;
    let coef: number;
    if (pendingCoef === "" || pendingCoef === "-") {
      coef = 0;
    } else {
      try {
        coef = math.evaluate(toMathJsFormat(pendingCoef)) as number;
      } catch {
        coef = NaN;
      }
    }
    if (Number.isFinite(coef)) {
      const newTerm: Term = {
        type: pendingTerm,
        coef,
        coefStr:
          pendingCoef.includes("/") || pendingCoef.includes("√")
            ? pendingCoef
            : undefined,
      };
      setTerms((prev) => mergeAndSortTerms([...prev, newTerm]));
    }
    setPendingTerm(null);
    setPendingCoef("");
  };

  const removeLastTerm = () => {
    setTerms((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  };

  const applyDescendingOrder = () => {
    setTerms((prev) => mergeAndSortTerms(prev));
  };

  const reset = () => {
    setTerms([{ type: "x2", coef: 0 }]);
    setPendingTerm(null);
    setPendingCoef("");
    setXValue(0);
    setXInputStr("0");
  };

  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, z * 1.15));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, z / 1.15));
  const zoomReset = () => setZoom(1);

  const yRangeF = useMemo(() => {
    if (!parsed.ok) return { min: -1, max: 1 };
    const { f } = parsed;
    const vals: number[] = [];
    for (let i = 0; i <= 500; i++) {
      const xx = xMin + (xMax - xMin) * (i / 500);
      try {
        vals.push(f(xx));
      } catch {
        // skip
      }
    }
    if (vals.length === 0) return { min: -1, max: 1 };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const m = (max - min) * 0.18 + 0.8;
    return { min: min - m, max: max + m };
  }, [parsed, xMin, xMax]);

  const yRangeD = useMemo(() => {
    if (!parsed.ok) return { min: -1, max: 1 };
    const { df } = parsed;
    const vals: number[] = [];
    for (let i = 0; i <= 500; i++) {
      const xx = xMin + (xMax - xMin) * (i / 500);
      try {
        vals.push(df(xx));
      } catch {
        // skip
      }
    }
    if (vals.length === 0) return { min: -1, max: 1 };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const m = (max - min) * 0.22 + 0.8;
    return { min: min - m, max: max + m };
  }, [parsed, xMin, xMax]);

  const sx = (v: number, width: number) =>
    pad + ((v - xMin) / (xMax - xMin)) * (width - pad * 2);

  const syF = (v: number) =>
    pad +
    (1 - (v - yRangeF.min) / (yRangeF.max - yRangeF.min)) * (H1 - pad * 2);

  const syD = (v: number) =>
    pad +
    (1 - (v - yRangeD.min) / (yRangeD.max - yRangeD.min)) * (H2 - pad * 2);

  const curveF = useMemo(() => {
    if (!parsed.ok) return "";
    const { f } = parsed;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 700; i++) {
      const xx = xMin + (xMax - xMin) * (i / 700);
      try {
        pts.push([sx(xx, W), syF(f(xx))]);
      } catch {
        // skip
      }
    }
    return toPath(pts);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syF/sx recreated each render
  }, [parsed, xMin, xMax]);

  const curveD = useMemo(() => {
    if (!parsed.ok) return "";
    const { df } = parsed;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 700; i++) {
      const xx = xMin + (xMax - xMin) * (i / 700);
      try {
        pts.push([sx(xx, W), syD(df(xx))]);
      } catch {
        // skip
      }
    }
    return toPath(pts);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syD/sx recreated each render
  }, [parsed, xMin, xMax]);

  const fx = parsed.ok
    ? (() => {
        try {
          return parsed.f(xValue);
        } catch {
          return NaN;
        }
      })()
    : NaN;
  const dfx = parsed.ok
    ? (() => {
        try {
          return parsed.df(xValue);
        } catch {
          return NaN;
        }
      })()
    : NaN;

  const xPx = sx(xValue, W);
  const yF = parsed.ok
    ? (() => {
        try {
          return parsed.f(xValue);
        } catch {
          return NaN;
        }
      })()
    : NaN;
  const yD = parsed.ok
    ? (() => {
        try {
          return parsed.df(xValue);
        } catch {
          return NaN;
        }
      })()
    : NaN;

  return (
    <div className="flex justify-center p-6 pt-4">
      <div className="w-[900px] max-w-full">
        <div className="rounded-[22px] bg-limitdiff-card border-gradient border border-white/10 shadow-card backdrop-blur-sm overflow-hidden transition-shadow duration-300 hover:shadow-card-hover">
          {/* header */}
          <div className="p-5 bg-limitdiff-panel border-b border-white/10 space-y-4">
            {/* f(x) = 項を足して作る（数字だけ入力） */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-ui-base font-semibold shrink-0 text-lg">
                  f(x) =
                </span>
                <span className="text-accent-cyan font-mono text-lg min-h-[1.5rem] glow-text-cyan inline-flex flex-wrap items-baseline">
                  <FormulaText text={termsToDisplayString(terms)} />
                </span>
                {terms.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={applyDescendingOrder}
                      className="text-xs text-ui-muted hover:text-accent-cyan ml-2 rounded-lg px-2 py-1 hover:bg-accent-cyan/10 transition-all duration-200"
                    >
                      降べきの順
                    </button>
                    <button
                      type="button"
                      onClick={removeLastTerm}
                      className="text-xs text-ui-muted hover:text-accent-pink ml-1 rounded-lg px-2 py-1 hover:bg-accent-pink/10 transition-all duration-200"
                    >
                      最後の項を消す
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="text-xs text-ui-muted hover:text-accent-pink ml-1 rounded-lg px-2 py-1 hover:bg-accent-pink/10 transition-all duration-200"
                    >
                      リセット
                    </button>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-ui-muted shrink-0 font-medium">
                  項を追加:
                </span>
                {TERM_BUTTONS.map(({ type, label }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setPendingTerm(type);
                      setPendingCoef("");
                    }}
                    className={`rounded-xl py-2 px-3 text-sm font-medium border transition-all duration-200 ${
                      pendingTerm === type
                        ? "border-accent-cyan/60 bg-accent-cyan/20 text-white shadow-glow-cyan"
                        : "border-white/10 bg-white/5 text-ui-base hover:bg-accent-cyan/10 hover:text-white hover:border-accent-cyan/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                {pendingTerm !== null && (
                  <span className="flex items-center gap-1.5 flex-wrap ml-2">
                    <span className="text-xs text-ui-muted shrink-0">
                      {pendingTerm === "const" ? "定数" : "係数"}:
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={pendingCoef}
                      onChange={(e) =>
                        setPendingCoef(
                          stripLeadingZeros(
                            normalizeNumberInput(e.target.value)
                          )
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTerm();
                      }}
                      placeholder="直接入力"
                      className="w-20 px-2 py-1 rounded bg-black/30 border border-white/20 text-ui-base text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 placeholder:text-ui-dim"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPendingCoef((s) =>
                          s.startsWith("-")
                            ? s.slice(1) || ""
                            : s
                            ? `-${s}`
                            : "-"
                        )
                      }
                      className="rounded-lg py-1.5 px-2.5 text-sm border border-white/20 bg-white/8 text-ui-base hover:bg-accent-purple/15 hover:border-accent-purple/40 hover:text-white transition-all duration-200"
                    >
                      −
                    </button>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPendingCoef((s) => s + String(n))}
                        className="rounded-lg py-1.5 px-2.5 text-sm border border-white/20 bg-white/8 text-ui-base hover:bg-accent-cyan/15 hover:border-accent-cyan/40 hover:text-white transition-all duration-200 w-9"
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPendingCoef((s) => s + ".")}
                      disabled={pendingCoef.includes(".")}
                      className="rounded-lg py-1.5 px-2.5 text-sm border border-white/10 bg-white/5 text-ui-base hover:bg-accent-cyan/15 hover:border-accent-cyan/40 hover:text-white transition-all duration-200 w-9 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:border-white/10"
                    >
                      .
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingCoef((s) => {
                          // 空または"-"のみなら√を追加（先に√を押すパターン）
                          if (s === "" || s === "-") {
                            return s + "√";
                          }
                          // すでに√Xの形式（√8, -√12など）なら簡約化
                          const sqrtMatch = s.match(/^(-?)√(\d+)$/);
                          if (sqrtMatch) {
                            const [, sign, num] = sqrtMatch;
                            const simplified = simplifySquareRoot(
                              parseInt(num, 10)
                            );
                            return sign + simplified;
                          }
                          // 通常の数字なら√を計算して簡約化
                          const n = parseFloat(s);
                          if (Number.isFinite(n) && n >= 0) {
                            return simplifySquareRoot(n);
                          }
                          return s;
                        })
                      }
                      disabled={
                        pendingCoef.endsWith("√") ||
                        (!pendingCoef.includes("√") &&
                          pendingCoef !== "" &&
                          pendingCoef !== "-" &&
                          parseFloat(pendingCoef) < 0)
                      }
                      className="rounded-lg py-1.5 px-2.5 text-sm border border-white/10 bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/25 hover:border-accent-purple/50 hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent-purple/10"
                    >
                      √
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingCoef((s) => {
                          const n = parseFloat(s);
                          if (!Number.isFinite(n)) return s;
                          return String(Math.abs(n));
                        })
                      }
                      disabled={pendingCoef === "" || pendingCoef === "-"}
                      className="rounded-lg py-1.5 px-2.5 text-sm border border-white/10 bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/25 hover:border-accent-purple/50 hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent-purple/10"
                    >
                      |x|
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingCoef((s) => s + "/")}
                      disabled={pendingCoef.includes("/")}
                      className="rounded-lg py-1.5 px-2.5 text-sm border border-white/10 bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/25 hover:border-accent-blue/50 hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent-blue/10"
                    >
                      /
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingCoef((s) => s.slice(0, -1))}
                      disabled={pendingCoef === ""}
                      className="text-sm text-ui-muted hover:text-accent-orange px-2 py-1 rounded-lg hover:bg-accent-orange/10 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      戻る
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingCoef("")}
                      disabled={pendingCoef === ""}
                      className="text-sm text-ui-muted hover:text-accent-pink px-2 py-1 rounded-lg hover:bg-accent-pink/10 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      消す
                    </button>
                    <button
                      type="button"
                      onClick={addTerm}
                      className="rounded-xl py-1.5 px-4 text-sm font-medium bg-gradient-to-r from-accent-cyan/30 to-accent-purple/30 text-white border border-accent-cyan/40 hover:from-accent-cyan/50 hover:to-accent-purple/50 hover:shadow-glow-cyan transition-all duration-200"
                    >
                      追加
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingTerm(null);
                        setPendingCoef("");
                      }}
                      className="text-sm text-ui-muted hover:text-ui-base px-2 py-1 rounded-lg hover:bg-white/5 transition-all duration-200"
                    >
                      キャンセル
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* x の値（スライダー + 数値） */}
            <div className="flex flex-wrap items-end gap-5">
              <div className="min-w-[200px] flex-1 max-w-[320px]">
                <label className="text-sm text-ui-muted tracking-wide block mb-2 font-medium">
                  x を動かす
                </label>
                <input
                  type="range"
                  min={xMin}
                  max={xMax}
                  step={0.01}
                  value={xValue}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setXValue(v);
                    setXInputStr(v.toFixed(1));
                  }}
                  className="w-full h-1.5 rounded-lg cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-5 flex-wrap">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-ui-muted font-medium">x =</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={xInputStr}
                    onChange={(e) => {
                      const raw = stripLeadingZeros(
                        normalizeNumberInput(e.target.value)
                      );
                      setXInputStr(raw);
                      const n = Number(raw);
                      if (raw === "" || raw === "-" || Number.isFinite(n))
                        setXValue(raw === "" || raw === "-" ? 0 : n);
                    }}
                    onBlur={() => setXInputStr(xValue.toFixed(1))}
                      className="w-20 px-3 py-2 rounded-xl bg-transparent border border-white/20 text-ui-base text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan/30 tabular-nums transition-all duration-200"
                  />
                </div>
                {parsed.ok ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-ui-muted font-medium">
                        f'(x) =
                      </span>
                      <span className="text-sm text-accent-purple font-mono glow-text-purple">
                        <FormulaText text={derivativeToDisplay(parsed.dfStr)} />
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 px-3 py-2 rounded-xl bg-white/8 border border-white/20">
                      <span className="text-xs text-ui-muted font-medium">
                        f({xValue.toFixed(1)}) =
                      </span>
                      <span className="text-base text-accent-cyan tabular-nums font-semibold">
                        {fmt(fx, 1)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 px-3 py-2 rounded-xl bg-white/8 border border-white/20">
                      <span className="text-xs text-ui-muted font-medium">
                        f'({xValue.toFixed(1)}) =
                      </span>
                      <span className="text-base text-accent-purple tabular-nums font-semibold">
                        {fmt(dfx, 1)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-accent-pink text-sm flex items-center font-medium">
                    {parsed.error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* graphs */}
          <div className="p-5 bg-limitdiff-panel space-y-4">
            {parsed.ok && curveF ? (
              <>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <span className="text-sm text-ui-muted font-medium">
                    拡大・縮小:
                  </span>
                  <button
                    type="button"
                    onClick={zoomOut}
                    disabled={zoom <= ZOOM_MIN}
                      className="rounded-xl py-2 px-4 text-sm border border-white/20 bg-white/8 text-ui-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/25 transition-all duration-200"
                  >
                    −
                  </button>
                  <input
                    type="range"
                    min={ZOOM_MIN}
                    max={ZOOM_MAX}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-32 h-1.5 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={zoomIn}
                    disabled={zoom >= ZOOM_MAX}
                      className="rounded-xl py-2 px-4 text-sm border border-white/20 bg-white/8 text-ui-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/25 transition-all duration-200"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={zoomReset}
                    className="rounded-xl py-2 px-4 text-sm border border-white/20 bg-white/8 text-ui-base hover:bg-accent-cyan/10 hover:border-accent-cyan/30 hover:text-accent-cyan transition-all duration-200"
                  >
                    1:1
                  </button>
                  <span className="text-sm text-ui-muted tabular-nums w-12 text-center font-medium">
                    {zoom.toFixed(1)}×
                  </span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4 overflow-x-auto shadow-inner">
                  <svg width={W} height={H1} className="block">
                    <GridLines
                      width={W}
                      height={H1}
                      pad={pad}
                      xMin={xMin}
                      xMax={xMax}
                      yMin={yRangeF.min}
                      yMax={yRangeF.max}
                      sx={sx}
                      sy={syF}
                      strokeGrid={strokeGrid}
                      strokeAxis={strokeAxis}
                    />
                    <path
                      d={curveF}
                      stroke={colors.f}
                      strokeWidth={2.5}
                      fill="none"
                      style={{
                        filter: "drop-shadow(0 0 4px rgba(34,211,238,0.35))",
                      }}
                    />
                    <line
                      x1={xPx}
                      y1={syF(yF)}
                      x2={xPx}
                      y2={H1 - pad}
                      stroke={colors.x}
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      opacity={0.8}
                    />
                    <circle cx={xPx} cy={syF(yF)} r={6} fill={colors.x} />
                    <text
                      x={xPx + 10}
                      y={syF(yF) + 4}
                      textAnchor="start"
                      style={{
                        fontSize: 11,
                        fill: "rgba(255,255,255,0.7)",
                        fontFamily: "system-ui",
                      }}
                    >
                      ({xValue.toFixed(1)}, {fmt(fx, 1)})
                    </text>
                  </svg>
                  <div className="flex gap-3 mt-3 flex-wrap">
                    <span className="rounded-xl py-2 px-4 border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan font-semibold cursor-default text-sm shadow-glow-cyan">
                      y = f(x)
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4 overflow-x-auto shadow-inner">
                  <svg width={W} height={H2} className="block">
                    <GridLines
                      width={W}
                      height={H2}
                      pad={pad}
                      xMin={xMin}
                      xMax={xMax}
                      yMin={yRangeD.min}
                      yMax={yRangeD.max}
                      sx={sx}
                      sy={syD}
                      strokeGrid={strokeGrid}
                      strokeAxis={strokeAxis}
                    />
                    <path
                      d={curveD}
                      stroke={colors.d}
                      strokeWidth={2.5}
                      fill="none"
                      style={{
                        filter: "drop-shadow(0 0 4px rgba(192,132,252,0.35))",
                      }}
                    />
                    <line
                      x1={xPx}
                      y1={syD(yD)}
                      x2={xPx}
                      y2={H2 - pad}
                      stroke={colors.x}
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      opacity={0.8}
                    />
                    <circle cx={xPx} cy={syD(yD)} r={6} fill={colors.x} />
                    <text
                      x={xPx + 10}
                      y={syD(yD) + 4}
                      textAnchor="start"
                      style={{
                        fontSize: 11,
                        fill: "rgba(255,255,255,0.7)",
                        fontFamily: "system-ui",
                      }}
                    >
                      ({xValue.toFixed(1)}, {fmt(dfx, 1)})
                    </text>
                  </svg>
                  <div className="flex gap-3 mt-3 flex-wrap">
                    <span className="rounded-xl py-2 px-4 border border-accent-purple/30 bg-accent-purple/10 text-accent-purple font-semibold cursor-default text-sm shadow-glow-purple">
                      y = f'(x)
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-8 text-center text-ui-muted">
                上の「項を追加」で x⁴, x³, x², x, 定数項
                を選び、係数（または定数）を数字で入力して追加してください。
              </div>
            )}
          </div>
        </div>
        <div className="h-6" />
      </div>
    </div>
  );
}
