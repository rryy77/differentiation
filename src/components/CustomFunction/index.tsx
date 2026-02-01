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
} from "../../shared";

const math = create(all);
const { W, H1, H2, pad } = LAYOUT;
const BASE_X_MIN = LAYOUT.xMin;
const BASE_X_MAX = LAYOUT.xMax;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;

type TermType = "x4" | "x3" | "x2" | "x" | "const";

const TERM_BUTTONS: { type: TermType; label: string }[] = [
  { type: "x4", label: "x⁴" },
  { type: "x3", label: "x³" },
  { type: "x2", label: "x²" },
  { type: "x", label: "x" },
  { type: "const", label: "定数項" },
];

function termToExprPart(t: { type: TermType; coef: number }): string {
  if (t.coef === 0) return "";
  if (t.type === "const") return String(t.coef);
  const base =
    t.type === "x4"
      ? "x^4"
      : t.type === "x3"
      ? "x^3"
      : t.type === "x2"
      ? "x^2"
      : "x";
  if (t.coef === 1) return base;
  if (t.coef === -1) return `-${base}`;
  return `${t.coef}*${base}`;
}

function termsToExpr(terms: Array<{ type: TermType; coef: number }>): string {
  const parts = terms
    .filter((t) => t.coef !== 0)
    .map(termToExprPart)
    .filter(Boolean);
  if (parts.length === 0) return "0";
  return parts.join(" + ").replace(/\s\+\s-/g, " - ");
}

/** 表示用：* ^ を使わず x⁴ x³ x² などで表示 */
function termToDisplayPart(t: { type: TermType; coef: number }): string {
  if (t.coef === 0) return "";
  if (t.type === "const") return String(t.coef);
  const base =
    t.type === "x4"
      ? "x⁴"
      : t.type === "x3"
      ? "x³"
      : t.type === "x2"
      ? "x²"
      : "x";
  if (t.coef === 1) return base;
  if (t.coef === -1) return `-${base}`;
  return `${t.coef}${base}`;
}

function termsToDisplayString(
  terms: Array<{ type: TermType; coef: number }>
): string {
  const parts = terms
    .filter((t) => t.coef !== 0)
    .map(termToDisplayPart)
    .filter(Boolean);
  if (parts.length === 0) return "0";
  return parts.join(" + ").replace(/\s\+\s-/g, " - ");
}

/** f'(x) の表示用：* と ^2 ^3 ^4 を ²³⁴ に置き換え */
function derivativeToDisplay(str: string): string {
  return str
    .replace(/\*/g, "")
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\^4/g, "⁴");
}

const DESC_ORDER: TermType[] = ["x4", "x3", "x2", "x", "const"];

function mergeAndSortTerms(
  terms: Array<{ type: TermType; coef: number }>
): Array<{ type: TermType; coef: number }> {
  const byType: Record<TermType, number> = {
    x4: 0,
    x3: 0,
    x2: 0,
    x: 0,
    const: 0,
  };
  for (const t of terms) {
    byType[t.type] += t.coef;
  }
  return DESC_ORDER.filter((type) => byType[type] !== 0).map((type) => ({
    type,
    coef: byType[type],
  }));
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
  const [terms, setTerms] = useState<Array<{ type: TermType; coef: number }>>([
    { type: "x2", coef: 1 },
  ]);
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
    const coef =
      pendingCoef === "" || pendingCoef === "-" ? 0 : parseFloat(pendingCoef);
    if (Number.isFinite(coef)) {
      setTerms((prev) =>
        mergeAndSortTerms([...prev, { type: pendingTerm, coef }])
      );
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
    <div className="flex justify-center p-6 pt-2">
      <div className="w-[900px] max-w-full">
        <div className="rounded-[22px] bg-limitdiff-card border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.50)] overflow-hidden">
          {/* header */}
          <div className="p-4 bg-[rgba(15,23,42,0.5)] border-b border-white/15 space-y-4">
            {/* f(x) = 項を足して作る（数字だけ入力） */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-ui-base font-medium shrink-0">
                  f(x) =
                </span>
                <span className="text-cyan-300 font-mono text-base min-h-[1.5rem]">
                  {termsToDisplayString(terms)}
                </span>
                {terms.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={applyDescendingOrder}
                      className="text-xs text-ui-muted hover:text-cyan-300 ml-1 rounded px-1.5 py-0.5 hover:bg-cyan-400/10"
                    >
                      降べきの順
                    </button>
                    <button
                      type="button"
                      onClick={removeLastTerm}
                      className="text-xs text-ui-muted hover:text-rose-400 ml-1"
                    >
                      最後の項を消す
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="text-xs text-ui-muted hover:text-rose-400 ml-1 rounded px-1.5 py-0.5 hover:bg-rose-500/10"
                    >
                      リセット
                    </button>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-ui-muted shrink-0">
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
                    className={`rounded-full py-1.5 px-2.5 text-xs border transition-colors ${
                      pendingTerm === type
                        ? "border-cyan-400/60 bg-cyan-400/20 text-white"
                        : "border-white/15 bg-white/5 text-ui-base hover:bg-white/10 hover:text-white hover:border-cyan-400/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                {pendingTerm !== null && (
                  <span className="flex items-center gap-2 flex-wrap ml-2">
                    <span className="text-xs text-ui-muted">
                      {pendingTerm === "const" ? "定数" : "係数"}:
                    </span>
                    <input
                      type="number"
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
                      placeholder={pendingTerm === "const" ? "例: -1" : "例: 3"}
                      className="w-16 px-2 py-1 rounded bg-white/5 border border-white/15 text-ui-base text-sm tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={addTerm}
                      className="rounded-full py-1 px-2 text-xs bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 hover:bg-cyan-500/50"
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
            </div>

            {/* x の値（スライダー + 数値） */}
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
                    className="w-20 px-2 py-1.5 rounded-lg bg-white/5 border border-white/15 text-ui-base text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50 tabular-nums"
                  />
                </div>
                {parsed.ok ? (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-ui-muted">f'(x) =</span>
                      <span className="text-sm text-cyan-300 font-mono">
                        {derivativeToDisplay(parsed.dfStr)}
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

          {/* graphs */}
          <div className="p-4 bg-limitdiff-panel space-y-3">
            {parsed.ok && curveF ? (
              <>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <span className="text-xs text-ui-muted">拡大・縮小:</span>
                  <button
                    type="button"
                    onClick={zoomOut}
                    disabled={zoom <= ZOOM_MIN}
                    className="rounded-lg py-1.5 px-3 text-sm border border-white/15 bg-white/5 text-ui-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
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
                    className="w-28 h-2 rounded-lg appearance-none bg-white/10 accent-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={zoomIn}
                    disabled={zoom >= ZOOM_MAX}
                    className="rounded-lg py-1.5 px-3 text-sm border border-white/15 bg-white/5 text-ui-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={zoomReset}
                    className="rounded-lg py-1.5 px-3 text-sm border border-white/15 bg-white/5 text-ui-base hover:bg-white/10"
                  >
                    1:1
                  </button>
                  <span className="text-xs text-ui-muted tabular-nums w-10">
                    {zoom.toFixed(1)}×
                  </span>
                </div>
                <div className="rounded-[18px] border border-white/15 bg-[rgba(15,23,42,0.5)] p-3 overflow-x-auto">
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
                      strokeWidth={2.3}
                      fill="none"
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
                  <div className="flex gap-2.5 mt-2.5 flex-wrap">
                    <span className="rounded-full py-2 px-2.5 border border-white/15 bg-white/[0.05] text-ui-base font-semibold cursor-default">
                      y = f(x)
                    </span>
                  </div>
                </div>

                <div className="mt-3.5 rounded-[18px] border border-white/15 bg-[rgba(15,23,42,0.5)] p-3 overflow-x-auto">
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
                      strokeWidth={2.3}
                      fill="none"
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
                  <div className="flex gap-2.5 mt-2.5 flex-wrap">
                    <span className="rounded-full py-2 px-2.5 border border-white/15 bg-white/[0.05] text-ui-base font-semibold cursor-default">
                      y = f'(x)
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[18px] border border-white/15 bg-[rgba(15,23,42,0.5)] p-8 text-center text-ui-muted">
                上の「項を追加」で x³, x², x, 定数項
                を選び、係数（または定数）を数字で入力して追加してください。
              </div>
            )}
          </div>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}
