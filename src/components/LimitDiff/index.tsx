import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FnType } from "./constants";
import { FUNCTIONS, EPS, LAYOUT } from "./constants";
import { toPath, clamp } from "./utils";
import { HeaderControls } from "./HeaderControls";
import { FunctionGraph } from "./FunctionGraph";
import { DerivativeGraph } from "./DerivativeGraph";

function getCriticalPoints(fnType: FnType, df: (x: number) => number): number[] {
  // x², x³, x⁴ はいずれも df(0)=0 のみ
  const candidates = [0];
  const out: number[] = [];
  for (const x of candidates) {
    if (Math.abs(df(x)) < 1e-6) out.push(x);
  }
  return out;
}

const { W, H1, H2, pad } = LAYOUT;

const X_SPAN_MIN = 2;
const X_SPAN_MAX = 20;
/** 初期表示のx軸の幅（大きいほど横に引き伸ばしたように見える） */
const DEFAULT_X_SPAN = 7;
const PAN_X_FACTOR = 0.45;
const PAN_Y_FACTOR = 0.45;

export default function LimitDiff() {
  const [fnType, setFnType] = useState<FnType>("x2");
  const [x, setX] = useState(0.6);
  const [xh, setXh] = useState(1.4);
  const [xSpan, setXSpan] = useState(DEFAULT_X_SPAN);
  const [panXF, setPanXF] = useState(0);
  const [panYF, setPanYF] = useState(0);
  const [panXD, setPanXD] = useState(0);
  const [panYD, setPanYD] = useState(0);

  const xMinF = panXF - xSpan / 2;
  const xMaxF = panXF + xSpan / 2;
  const xMinD = panXD - xSpan / 2;
  const xMaxD = panXD + xSpan / 2;

  const xMin = Math.max(xMinF, xMinD);
  const xMax = Math.min(xMaxF, xMaxD);
  const xMinClamp = xMin <= xMax ? xMin : xMinF;
  const xMaxClamp = xMin <= xMax ? xMax : xMaxF;

  useEffect(() => {
    setX((v) => clamp(v, xMinClamp, xMaxClamp));
    setXh((v) => clamp(v, xMinClamp, xMaxClamp));
  }, [xMinClamp, xMaxClamp]);

  const f = FUNCTIONS[fnType].f;
  const df = FUNCTIONS[fnType].df;

  // まず描画し、その後極値があればその部分を自動表示（パッと見で形が分かるように拡大）
  useEffect(() => {
    const critical = getCriticalPoints(fnType, df);
    if (critical.length === 0) return;
    const padX = fnType === "x4" ? 1.5 : 0.5;
    const xLo = Math.min(...critical) - padX;
    const xHi = Math.max(...critical) + padX;
    const sampleN = 100;
    let yLo = f(critical[0]);
    let yHi = yLo;
    for (let i = 0; i <= sampleN; i++) {
      const xx = xLo + (xHi - xLo) * (i / sampleN);
      const yy = f(xx);
      if (Number.isFinite(yy)) {
        yLo = Math.min(yLo, yy);
        yHi = Math.max(yHi, yy);
      }
    }
    const bboxW = xHi - xLo;
    const bboxH = Math.max(yHi - yLo, bboxW * 0.2);
    const aspect = (H1 - pad * 2) / (W - pad * 2);
    const fitXSpan = Math.max(bboxW, bboxH / aspect) * 1.05;
    let newXSpan = Math.max(X_SPAN_MIN, Math.min(X_SPAN_MAX, fitXSpan));
    // x軸の幅をきれいな整数に丸めて、横を引き伸ばした表示にする（2〜7）
    if (newXSpan <= 2.5) newXSpan = 2;
    else if (newXSpan <= 3.5) newXSpan = 3;
    else if (newXSpan <= 4.5) newXSpan = 4;
    else if (newXSpan <= 5.5) newXSpan = 5;
    else if (newXSpan <= 6.5) newXSpan = 6;
    else newXSpan = Math.min(8, Math.round(newXSpan));
    setXSpan(newXSpan);
    const centerX = (xLo + xHi) / 2;
    setPanXF(centerX);
    setPanXD(centerX);
    setPanYF((yLo + yHi) / 2);
    setPanYD((yLo + yHi) / 2);
  }, [fnType, f, df]);

  const dragging = useRef<"x" | "xh" | "pan" | null>(null);
  const lastPan = useRef({ x: 0, y: 0 });

  const yRangeF = useMemo(() => {
    const span = xMaxF - xMinF;
    const xLo = xMinF - span * 0.35;
    const xHi = xMaxF + span * 0.35;
    const vals: number[] = [];
    for (let i = 0; i <= 500; i++) {
      const xx = xLo + (xHi - xLo) * (i / 500);
      vals.push(f(xx));
    }
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const m = (max - min) * 0.18 + 0.8;
    const raw = { min: min - m, max: max + m };
    const baseSpan = ((H1 - pad * 2) * (xMaxF - xMinF)) / (W - pad * 2);
    const center = (raw.min + raw.max) / 2 + panYF;
    return { min: center - baseSpan / 2, max: center + baseSpan / 2 };
  }, [f, xMinF, xMaxF, panYF]);

  const yRangeD = useMemo(() => {
    const span = xMaxD - xMinD;
    const xLo = xMinD - span * 0.35;
    const xHi = xMaxD + span * 0.35;
    const vals: number[] = [];
    for (let i = 0; i <= 500; i++) {
      const xx = xLo + (xHi - xLo) * (i / 500);
      vals.push(df(xx));
    }
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const m = (max - min) * 0.22 + 0.8;
    const raw = { min: min - m, max: max + m };
    const baseSpan = ((H2 - pad * 2) * (xMaxD - xMinD)) / (W - pad * 2);
    const center = (raw.min + raw.max) / 2 + panYD;
    return { min: center - baseSpan / 2, max: center + baseSpan / 2 };
  }, [df, xMinD, xMaxD, panYD]);

  const sxF = (v: number, width: number) =>
    pad + ((v - xMinF) / (xMaxF - xMinF)) * (width - pad * 2);
  const sxD = (v: number, width: number) =>
    pad + ((v - xMinD) / (xMaxD - xMinD)) * (width - pad * 2);

  const syF = (v: number) =>
    pad +
    (1 - (v - yRangeF.min) / (yRangeF.max - yRangeF.min)) * (H1 - pad * 2);

  const syD = (v: number) =>
    pad +
    (1 - (v - yRangeD.min) / (yRangeD.max - yRangeD.min)) * (H2 - pad * 2);

  const invXF = (px: number, width: number) =>
    xMinF + ((px - pad) / (width - pad * 2)) * (xMaxF - xMinF);
  const invXD = (px: number, width: number) =>
    xMinD + ((px - pad) / (width - pad * 2)) * (xMaxD - xMinD);

  const curveF = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 700; i++) {
      const xx = xMinF + (xMaxF - xMinF) * (i / 700);
      pts.push([sxF(xx, W), syF(f(xx))]);
    }
    return toPath(pts);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- syF/sxF recreated each render
  }, [fnType, f, xMinF, xMaxF, yRangeF.min, yRangeF.max]);

  const curveD = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 700; i++) {
      const xx = xMinD + (xMaxD - xMinD) * (i / 700);
      pts.push([sxD(xx, W), syD(df(xx))]);
    }
    return toPath(pts);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- syD/sxD recreated each render
  }, [fnType, df, xMinD, xMaxD, yRangeD.min, yRangeD.max]);

  const tangentF = (a: number) => {
    const m = df(a);
    const y0 = f(a);
    const dx = 3.2;
    return toPath([
      [sxF(a - dx, W), syF(m * -dx + y0)],
      [sxF(a + dx, W), syF(m * dx + y0)],
    ]);
  };

  const h = xh - x;
  const fx = f(x);
  const fxh = f(xh);
  const secant = Math.abs(h) < EPS ? NaN : (fxh - fx) / h;
  const dfx = df(x);
  const dfxh = df(xh);

  const goLimit = () => setXh(x + Math.sign(h || 1) * EPS);

  const reset = () => {
    setFnType("x2");
    setXSpan(DEFAULT_X_SPAN);
    setPanXF(0);
    setPanYF(0);
    setPanXD(0);
    setPanYD(0);
    setX(0);
    setXh(0.5);
  };

  const xSpanIn = () =>
    setXSpan((s) => Math.min(X_SPAN_MAX, s * 1.2));
  const xSpanOut = () =>
    setXSpan((s) => Math.max(X_SPAN_MIN, s / 1.2));
  const xSpanReset = () => setXSpan(DEFAULT_X_SPAN);

  const onPanStartF = (e: React.PointerEvent) => {
    if (dragging.current) return;
    if ((e.target as SVGElement).tagName === "line") return;
    dragging.current = "pan";
    lastPan.current = { x: e.clientX, y: e.clientY };
  };

  const onMoveF = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    if (dragging.current === "pan") {
      e.preventDefault();
      const moveX = e.clientX - lastPan.current.x;
      const moveY = e.clientY - lastPan.current.y;
      lastPan.current = { x: e.clientX, y: e.clientY };
      const drawW = W - pad * 2;
      const drawH = H1 - pad * 2;
      const dxData = (moveX / drawW) * (xMaxF - xMinF) * PAN_X_FACTOR;
      const dyData = -(moveY / drawH) * (yRangeF.max - yRangeF.min) * PAN_Y_FACTOR;
      setPanXF((p) => p - dxData);
      setPanYF((p) => p - dyData);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const nx = clamp(invXF(px, W), xMinF, xMaxF);
    dragging.current === "x" ? setX(nx) : setXh(nx);
  };

  const onPanStartD = (e: React.PointerEvent) => {
    if (dragging.current) return;
    if ((e.target as SVGElement).tagName === "line") return;
    dragging.current = "pan";
    lastPan.current = { x: e.clientX, y: e.clientY };
  };

  const onMoveD = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    if (dragging.current === "pan") {
      e.preventDefault();
      const moveX = e.clientX - lastPan.current.x;
      const moveY = e.clientY - lastPan.current.y;
      lastPan.current = { x: e.clientX, y: e.clientY };
      const drawW = W - pad * 2;
      const drawH = H2 - pad * 2;
      const dxData = (moveX / drawW) * (xMaxD - xMinD) * PAN_X_FACTOR;
      const dyData = -(moveY / drawH) * (yRangeD.max - yRangeD.min) * PAN_Y_FACTOR;
      setPanXD((p) => p - dxData);
      setPanYD((p) => p - dyData);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const nx = clamp(invXD(px, W), xMinD, xMaxD);
    dragging.current === "x" ? setX(nx) : setXh(nx);
  };

  const clearDragging = () => {
    dragging.current = null;
  };

  return (
    <div className="flex justify-center p-6 pt-4">
      <div className="w-[900px] max-w-full">
        <div className="rounded-[22px] bg-limitdiff-card border-gradient border border-white/10 shadow-card backdrop-blur-sm overflow-hidden transition-shadow duration-300 hover:shadow-card-hover">
          <HeaderControls
            fnType={fnType}
            setFnType={setFnType}
            x={x}
            setX={setX}
            xh={xh}
            setXh={setXh}
            xMin={xMin}
            xMax={xMax}
            goLimit={goLimit}
            onReset={reset}
            h={h}
            fx={fx}
            fxh={fxh}
            secant={secant}
            dfx={dfx}
            dfxh={dfxh}
          />

          <div className="p-5 bg-limitdiff-panel space-y-4">
            <div className="flex flex-wrap items-center justify-end gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-ui-muted font-medium">x軸の幅:</span>
                <button
                  type="button"
                  onClick={xSpanOut}
                  disabled={xSpan <= X_SPAN_MIN}
                  className="rounded-xl py-2 px-4 text-sm border border-white/20 bg-white/8 text-ui-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/25 transition-all duration-200"
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
                  className="w-32 h-1.5 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={xSpanIn}
                  disabled={xSpan >= X_SPAN_MAX}
                  className="rounded-xl py-2 px-4 text-sm border border-white/20 bg-white/8 text-ui-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/25 transition-all duration-200"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={xSpanReset}
                  className="rounded-xl py-2 px-4 text-sm border border-white/20 bg-white/8 text-ui-base hover:bg-accent-cyan/10 hover:border-accent-cyan/30 hover:text-accent-cyan transition-all duration-200"
                >
                  1:1
                </button>
                <span className="text-sm text-ui-muted tabular-nums w-12 text-center font-medium">
                  {xSpan.toFixed(1)}
                </span>
              </div>
            </div>
            <p className="text-xs text-ui-dim text-right">グラフ内をドラッグまたはスワイプで移動</p>
            <FunctionGraph
              width={W}
              height={H1}
              pad={pad}
              xMin={xMinF}
              xMax={xMaxF}
              yRangeF={yRangeF}
              sx={sxF}
              syF={syF}
              curveF={curveF}
              tangentF={tangentF}
              x={x}
              xh={xh}
              fx={fx}
              fxh={fxh}
              onPointerMove={onMoveF}
              onPointerUp={clearDragging}
              onPointerLeave={clearDragging}
              onMouseDownX={() => (dragging.current = "x")}
              onMouseDownXh={() => (dragging.current = "xh")}
              onPointerDownBackground={onPanStartF}
            />

            <DerivativeGraph
              width={W}
              height={H2}
              pad={pad}
              xMin={xMinD}
              xMax={xMaxD}
              yRangeD={yRangeD}
              sx={sxD}
              syD={syD}
              curveD={curveD}
              x={x}
              xh={xh}
              dfx={dfx}
              dfxh={dfxh}
              onMouseDownX={() => (dragging.current = "x")}
              onMouseDownXh={() => (dragging.current = "xh")}
              onPointerDownBackground={onPanStartD}
              onPointerMove={onMoveD}
              onPointerUp={clearDragging}
              onPointerLeave={clearDragging}
            />
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
