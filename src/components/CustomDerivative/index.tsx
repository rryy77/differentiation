import React, { useEffect, useMemo, useRef, useState } from "react";
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
const X_SPAN_MIN = 2;
const X_SPAN_MAX = 20;
const DEFAULT_X_SPAN = 7;
const PAN_X_FACTOR = 0.45;
const PAN_Y_FACTOR = 0.45;

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

/** f'(x) の項 → mathjs 用数式（coefStr があれば分数・√をそのまま使う） */
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

/** f'(x) の項 → 表示用（x⁴ x³ など、分数は FormulaText で縦書き表示） */
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

/** ∫f'(x)dx の項を構築（coefStr があれば分数・√をそのまま使う） */
function termToIntegralPart(t: Term): string {
  if (t.coef === 0) return "";
  const coefPart = t.coefStr
    ? t.coefStr.includes("√")
      ? toMathJsFormat(t.coefStr)
      : t.coefStr
    : String(t.coef);
  if (t.type === "const") return `${coefPart}*x`;
  if (t.type === "x4") return `${coefPart}/5*x^5`;
  if (t.type === "x3") return `${coefPart}/4*x^4`;
  if (t.type === "x2") return `${coefPart}/3*x^3`;
  if (t.type === "x") return `${coefPart}/2*x^2`;
  return "";
}

function termsToIntegralExpr(terms: Term[], c: number): string {
  const parts = terms
    .filter((t) => t.coef !== 0)
    .map(termToIntegralPart)
    .filter(Boolean);
  if (c !== 0) parts.push(String(c));
  if (parts.length === 0) return "0";
  return parts.join(" + ").replace(/\s\+\s-/g, " - ");
}

/** f(x) の表示用：* と ^ を除去、sqrt(n)→√n（分数は FormulaText で縦書き表示） */
function integralToDisplay(str: string): string {
  return str
    .replace(/\*/g, "")
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\^4/g, "⁴")
    .replace(/\^5/g, "⁵")
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
    return { type, coef, coefStr: nonzeroCount === 1 ? coefStr : undefined };
  });
}

type ParsedState =
  | {
      ok: true;
      f: (x: number) => number;
      df: (x: number) => number;
      fStr: string;
      dfStr: string;
    }
  | { ok: false; error: string };

/** 項リストから f'(x) と f(x)=∫f'(x)dx を構築 */
function parseFromTerms(
  terms: Term[],
  integralConst: number
): ParsedState {
  const dfExprString = termsToExpr(terms);
  const trimmed = dfExprString.trim();
  if (!trimmed) return { ok: false, error: "f'(x) の項を追加してください" };
  try {
    const dfNode = math.parse(trimmed);
    const df = (x: number) => (dfNode.evaluate({ x }) as number) ?? NaN;
    const dfStr = dfNode.toString();

    const fExprString = termsToIntegralExpr(terms, integralConst);
    const fNode = math.parse(fExprString);
    const f = (x: number) => (fNode.evaluate({ x }) as number) ?? NaN;
    return { ok: true, f, df, fStr: fExprString, dfStr };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

export default function CustomDerivative() {
  const [terms, setTerms] = useState<Term[]>([{ type: "x", coef: 0 }]);
  const [integralConst, setIntegralConst] = useState(0);
  const [integralConstStr, setIntegralConstStr] = useState("0");
  const [pendingTerm, setPendingTerm] = useState<TermType | null>(null);
  const [pendingCoef, setPendingCoef] = useState("");
  const [xValue, setXValue] = useState(0.6);
  const [xInputStr, setXInputStr] = useState("0.6");
  const [xSpan, setXSpan] = useState(DEFAULT_X_SPAN);
  const [panXF, setPanXF] = useState(0);
  const [panYF, setPanYF] = useState(0);
  const [panXD, setPanXD] = useState(0);
  const [panYD, setPanYD] = useState(0);
  const panning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });

  const xMinF = panXF - xSpan / 2;
  const xMaxF = panXF + xSpan / 2;
  const xMinD = panXD - xSpan / 2;
  const xMaxD = panXD + xSpan / 2;

  const xMinClamp = Math.max(xMinF, xMinD);
  const xMaxClamp = Math.min(xMaxF, xMaxD);
  const xMin = xMinClamp <= xMaxClamp ? xMinClamp : xMinF;
  const xMax = xMinClamp <= xMaxClamp ? xMaxClamp : xMaxF;

  useEffect(() => {
    setXValue((v) => {
      const c = Math.max(xMin, Math.min(xMax, v));
      setXInputStr(c.toFixed(1));
      return c;
    });
  }, [xMin, xMax]);

  const parsed = useMemo(
    () => parseFromTerms(terms, integralConst),
    [terms, integralConst]
  );

  // まず描画し、その後極値があればその部分を自動表示（パッと見で形が分かるように拡大）
  useEffect(() => {
    if (!parsed.ok || !parsed.df) return;
    const { f, df } = parsed;
    const searchMin = -8;
    const searchMax = 8;
    const n = 200;
    const critical: number[] = [];
    let prev = df(searchMin);
    for (let i = 1; i <= n; i++) {
      const x = searchMin + (searchMax - searchMin) * (i / n);
      const v = df(x);
      if (!Number.isFinite(v)) continue;
      if (prev * v <= 0) critical.push(x - (searchMax - searchMin) / (2 * n));
      prev = v;
    }
    if (critical.length === 0) return;
    const padX = 0.5;
    const xLo = Math.min(...critical) - padX;
    const xHi = Math.max(...critical) + padX;
    const sampleN = 80;
    let yLo = f(critical[0]);
    let yHi = yLo;
    for (let i = 0; i <= sampleN; i++) {
      const xx = xLo + (xHi - xLo) * (i / sampleN);
      try {
        const yy = f(xx);
        if (Number.isFinite(yy)) {
          yLo = Math.min(yLo, yy);
          yHi = Math.max(yHi, yy);
        }
      } catch {
        // skip
      }
    }
    const bboxW = xHi - xLo;
    const bboxH = Math.max(yHi - yLo, bboxW * 0.2);
    const aspect = (H1 - pad * 2) / (W - pad * 2);
    const fitXSpan = Math.max(bboxW, bboxH / aspect) * 1.05;
    let newXSpan = Math.max(X_SPAN_MIN, Math.min(X_SPAN_MAX, fitXSpan));
    if (newXSpan <= 2.5) newXSpan = 2;
    else if (newXSpan <= 3.5) newXSpan = 3;
    else if (newXSpan <= 4.5) newXSpan = 4;
    else if (newXSpan <= 5.5) newXSpan = 5;
    else if (newXSpan <= 6.5) newXSpan = 6;
    else newXSpan = Math.min(8, Math.round(newXSpan));
    setXSpan(newXSpan);
    setPanYF((yLo + yHi) / 2);
    setPanYD((yLo + yHi) / 2);
  }, [terms, integralConst]);

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
    setTerms([{ type: "x", coef: 0 }]);
    setIntegralConst(0);
    setIntegralConstStr("0");
    setPendingTerm(null);
    setPendingCoef("");
    setXValue(0);
    setXInputStr("0");
    setXSpan(DEFAULT_X_SPAN);
    setPanXF(0);
    setPanYF(0);
    setPanXD(0);
    setPanYD(0);
  };

  const xSpanIn = () => setXSpan((s) => Math.min(X_SPAN_MAX, s * 1.2));
  const xSpanOut = () => setXSpan((s) => Math.max(X_SPAN_MIN, s / 1.2));
  const xSpanReset = () => setXSpan(DEFAULT_X_SPAN);

  const yRangeF = useMemo(() => {
    if (!parsed.ok) return { min: -1, max: 1 };
    const { f } = parsed;
    const vals: number[] = [];
    for (let i = 0; i <= 500; i++) {
      const xx = xMinF + (xMaxF - xMinF) * (i / 500);
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
    const raw = { min: min - m, max: max + m };
    const baseSpan = ((H2 - pad * 2) * (xMaxF - xMinF)) / (W - pad * 2);
    const center = (raw.min + raw.max) / 2 + panYF;
    return { min: center - baseSpan / 2, max: center + baseSpan / 2 };
  }, [parsed, xMinF, xMaxF, panYF]);

  const yRangeD = useMemo(() => {
    if (!parsed.ok) return { min: -1, max: 1 };
    const { df } = parsed;
    const vals: number[] = [];
    for (let i = 0; i <= 500; i++) {
      const xx = xMinD + (xMaxD - xMinD) * (i / 500);
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
    const raw = { min: min - m, max: max + m };
    const baseSpan = ((H1 - pad * 2) * (xMaxD - xMinD)) / (W - pad * 2);
    const center = (raw.min + raw.max) / 2 + panYD;
    return { min: center - baseSpan / 2, max: center + baseSpan / 2 };
  }, [parsed, xMinD, xMaxD, panYD]);

  const sxF = (v: number, width: number) =>
    pad + ((v - xMinF) / (xMaxF - xMinF)) * (width - pad * 2);
  const sxD = (v: number, width: number) =>
    pad + ((v - xMinD) / (xMaxD - xMinD)) * (width - pad * 2);

  const syF = (v: number) =>
    pad +
    (1 - (v - yRangeF.min) / (yRangeF.max - yRangeF.min)) * (H2 - pad * 2);

  const syD = (v: number) =>
    pad +
    (1 - (v - yRangeD.min) / (yRangeD.max - yRangeD.min)) * (H1 - pad * 2);

  const curveF = useMemo(() => {
    if (!parsed.ok) return "";
    const { f } = parsed;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 700; i++) {
      const xx = xMinF + (xMaxF - xMinF) * (i / 700);
      try {
        pts.push([sxF(xx, W), syF(f(xx))]);
      } catch {
        // skip
      }
    }
    return toPath(pts);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syF/sxF recreated each render
  }, [parsed, xMinF, xMaxF]);

  const curveD = useMemo(() => {
    if (!parsed.ok) return "";
    const { df } = parsed;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 700; i++) {
      const xx = xMinD + (xMaxD - xMinD) * (i / 700);
      try {
        pts.push([sxD(xx, W), syD(df(xx))]);
      } catch {
        // skip
      }
    }
    return toPath(pts);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syD/sxD recreated each render
  }, [parsed, xMinD, xMaxD]);

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

  const xPxD = sxD(xValue, W);
  const xPxF = sxF(xValue, W);
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
          <div className="p-5 bg-limitdiff-panel border-b border-white/10 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-ui-base font-semibold shrink-0 text-lg">
                  f'(x) =
                </span>
                <span className="text-accent-purple font-mono text-lg min-h-[1.5rem] glow-text-purple inline-flex flex-wrap items-baseline">
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
                  f'(x) の項を追加:
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
                        : "border-white/20 bg-white/8 text-ui-base hover:bg-accent-cyan/10 hover:text-white hover:border-accent-cyan/40"
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
                      className="text-xs text-ui-muted hover:text-ui-base"
                    >
                      キャンセル
                    </button>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <span className="text-xs text-ui-muted shrink-0">
                  積分定数 C =
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={integralConstStr}
                  onChange={(e) => {
                    const raw = stripLeadingZeros(
                      normalizeNumberInput(e.target.value)
                    );
                    setIntegralConstStr(raw);
                    const n = Number(raw);
                    if (raw === "" || raw === "-" || Number.isFinite(n))
                      setIntegralConst(raw === "" || raw === "-" ? 0 : n);
                  }}
                  onBlur={() => setIntegralConstStr(integralConst.toFixed(1))}
                  className="w-16 px-2 py-1 rounded bg-transparent border border-white/20 text-ui-base text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex-1 max-w-[320px]">
                <label className="text-xs text-ui-muted tracking-wide block mb-1">
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
                  className="w-full h-2 rounded-lg appearance-none bg-white/10 accent-cyan-400"
                />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-ui-muted">x =</span>
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
                    className="w-20 px-2 py-1.5 rounded-lg bg-transparent border border-white/20 text-ui-base text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 tabular-nums"
                  />
                </div>
                {parsed.ok ? (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-ui-muted">f(x) =</span>
                      <span className="text-sm text-cyan-300 font-mono">
                        <FormulaText
                          text={integralToDisplay(
                            termsToIntegralExpr(terms, integralConst)
                          )}
                        />
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-ui-muted">
                        f({xValue.toFixed(1)}) =
                      </span>
                      <span className="text-sm text-ui-base tabular-nums">
                        {fmt(fx, 1)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-ui-muted">
                        f'({xValue.toFixed(1)}) =
                      </span>
                      <span className="text-sm text-ui-base tabular-nums">
                        {fmt(dfx, 1)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-rose-400 text-sm flex items-center">
                    {parsed.error}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-limitdiff-panel space-y-3">
            {parsed.ok && curveF ? (
              <>
                <div className="flex flex-wrap items-center justify-end gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-ui-muted">x軸の幅:</span>
                    <button
                      type="button"
                      onClick={xSpanOut}
                      disabled={xSpan <= X_SPAN_MIN}
                      className="rounded-lg py-1.5 px-3 text-sm border border-white/15 bg-white/5 text-ui-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min={X_SPAN_MIN}
                      max={X_SPAN_MAX}
                      step={0.5}
                      value={xSpan}
                      onChange={(e) => setXSpan(Number(e.target.value))}
                      className="w-28 h-2 rounded-lg appearance-none bg-white/10 accent-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={xSpanIn}
                      disabled={xSpan >= X_SPAN_MAX}
                      className="rounded-lg py-1.5 px-3 text-sm border border-white/15 bg-white/5 text-ui-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={xSpanReset}
                      className="rounded-lg py-1.5 px-3 text-sm border border-white/15 bg-white/5 text-ui-base hover:bg-accent-cyan/10 hover:border-accent-cyan/30 hover:text-accent-cyan transition-all duration-200"
                    >
                      1:1
                    </button>
                    <span className="text-xs text-ui-muted tabular-nums w-10">
                      {xSpan.toFixed(1)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-ui-dim text-right">グラフ内をドラッグまたはスワイプで移動</p>
                <div className="rounded-[18px] border border-white/15 bg-[rgba(15,23,42,0.5)] p-3 overflow-hidden">
                  <svg
                    width={W}
                    height={H1}
                    className="block touch-none cursor-grab active:cursor-grabbing"
                    onPointerDown={(e) => {
                      const tag = (e.target as SVGElement).tagName;
                      if (tag !== "circle" && tag !== "line") {
                        panning.current = true;
                        lastPan.current = { x: e.clientX, y: e.clientY };
                      }
                    }}
                    onPointerMove={(e) => {
                      if (!panning.current) return;
                      e.preventDefault();
                      const dx = e.clientX - lastPan.current.x;
                      const dy = e.clientY - lastPan.current.y;
                      lastPan.current = { x: e.clientX, y: e.clientY };
                      const dxData = (dx / (W - pad * 2)) * (xMaxD - xMinD) * PAN_X_FACTOR;
                      const dyData = -(dy / (H1 - pad * 2)) * (yRangeD.max - yRangeD.min) * PAN_Y_FACTOR;
                      setPanXD((p) => p - dxData);
                      setPanYD((p) => p - dyData);
                    }}
                    onPointerUp={() => { panning.current = false; }}
                    onPointerLeave={() => { panning.current = false; }}
                  >
                    <rect width={W} height={H1} fill="transparent" style={{ cursor: "grab" }} />
                    <GridLines
                      width={W}
                      height={H1}
                      pad={pad}
                      xMin={xMinD}
                      xMax={xMaxD}
                      yMin={yRangeD.min}
                      yMax={yRangeD.max}
                      sx={sxD}
                      sy={syD}
                      strokeGrid={strokeGrid}
                      strokeAxis={strokeAxis}
                    />
                    <path
                      d={curveD}
                      stroke={colors.d}
                      strokeWidth={2.3}
                      fill="none"
                    />
                    <line
                      x1={xPxD}
                      y1={syD(yD)}
                      x2={xPxD}
                      y2={H1 - pad}
                      stroke={colors.x}
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      opacity={0.8}
                    />
                    <circle cx={xPxD} cy={syD(yD)} r={6} fill={colors.x} />
                    <text
                      x={xPxD + 10}
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
                  <div className="flex gap-2.5 mt-2.5 flex-wrap">
                    <span className="rounded-full py-2 px-2.5 border border-white/15 bg-white/[0.05] text-ui-base font-semibold cursor-default">
                      y = f'(x)
                    </span>
                  </div>
                </div>

                <div className="mt-3.5 rounded-[18px] border border-white/15 bg-[rgba(15,23,42,0.5)] p-3 overflow-hidden">
                  <svg
                    width={W}
                    height={H2}
                    className="block touch-none cursor-grab active:cursor-grabbing"
                    onPointerDown={(e) => {
                      const tag = (e.target as SVGElement).tagName;
                      if (tag !== "circle" && tag !== "line") {
                        panning.current = true;
                        lastPan.current = { x: e.clientX, y: e.clientY };
                      }
                    }}
                    onPointerMove={(e) => {
                      if (!panning.current) return;
                      e.preventDefault();
                      const dx = e.clientX - lastPan.current.x;
                      const dy = e.clientY - lastPan.current.y;
                      lastPan.current = { x: e.clientX, y: e.clientY };
                      const dxData = (dx / (W - pad * 2)) * (xMaxF - xMinF) * PAN_X_FACTOR;
                      const dyData = -(dy / (H2 - pad * 2)) * (yRangeF.max - yRangeF.min) * PAN_Y_FACTOR;
                      setPanXF((p) => p - dxData);
                      setPanYF((p) => p - dyData);
                    }}
                    onPointerUp={() => { panning.current = false; }}
                    onPointerLeave={() => { panning.current = false; }}
                  >
                    <rect width={W} height={H2} fill="transparent" style={{ cursor: "grab" }} />
                    <GridLines
                      width={W}
                      height={H2}
                      pad={pad}
                      xMin={xMinF}
                      xMax={xMaxF}
                      yMin={yRangeF.min}
                      yMax={yRangeF.max}
                      sx={sxF}
                      sy={syF}
                      strokeGrid={strokeGrid}
                      strokeAxis={strokeAxis}
                    />
                    <path
                      d={curveF}
                      stroke={colors.f}
                      strokeWidth={2.3}
                      fill="none"
                    />
                    <line
                      x1={xPxF}
                      y1={syF(yF)}
                      x2={xPxF}
                      y2={H2 - pad}
                      stroke={colors.x}
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      opacity={0.8}
                    />
                    <circle cx={xPxF} cy={syF(yF)} r={6} fill={colors.x} />
                    <text
                      x={xPxF + 10}
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
                  <div className="flex gap-2.5 mt-2.5 flex-wrap">
                    <span className="rounded-full py-2 px-2.5 border border-white/15 bg-white/[0.05] text-ui-base font-semibold cursor-default">
                      y = f(x)
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[18px] border border-white/15 bg-[rgba(15,23,42,0.5)] p-8 text-center text-ui-muted">
                「f'(x) の項を追加」で 導関数 の形を作り、積分定数 C
                を指定すると f(x) が求まります。
              </div>
            )}
          </div>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}
