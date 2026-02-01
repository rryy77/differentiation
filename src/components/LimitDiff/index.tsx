import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FnType } from "./constants";
import { FUNCTIONS, EPS, LAYOUT } from "./constants";
import { toPath, clamp } from "./utils";
import { HeaderControls } from "./HeaderControls";
import { FunctionGraph } from "./FunctionGraph";
import { DerivativeGraph } from "./DerivativeGraph";

const { W, H1, H2, pad } = LAYOUT;
const BASE_X_MIN = LAYOUT.xMin;
const BASE_X_MAX = LAYOUT.xMax;

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;

export default function LimitDiff() {
  const [fnType, setFnType] = useState<FnType>("x2");
  const [x, setX] = useState(0.6);
  const [xh, setXh] = useState(1.4);
  const [zoom, setZoom] = useState(1);

  const xMin = BASE_X_MIN / zoom;
  const xMax = BASE_X_MAX / zoom;

  useEffect(() => {
    setX((v) => clamp(v, xMin, xMax));
    setXh((v) => clamp(v, xMin, xMax));
  }, [xMin, xMax]);

  const f = FUNCTIONS[fnType].f;
  const df = FUNCTIONS[fnType].df;

  const dragging = useRef<"x" | "xh" | null>(null);

  const yRangeF = useMemo(() => {
    const vals: number[] = [];
    for (let i = 0; i <= 500; i++) {
      const xx = xMin + (xMax - xMin) * (i / 500);
      vals.push(f(xx));
    }
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const m = (max - min) * 0.18 + 0.8;
    return { min: min - m, max: max + m };
  }, [f, xMin, xMax]);

  const yRangeD = useMemo(() => {
    const vals: number[] = [];
    for (let i = 0; i <= 500; i++) {
      const xx = xMin + (xMax - xMin) * (i / 500);
      vals.push(df(xx));
    }
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const m = (max - min) * 0.22 + 0.8;
    return { min: min - m, max: max + m };
  }, [df, xMin, xMax]);

  const sx = (v: number, width: number) =>
    pad + ((v - xMin) / (xMax - xMin)) * (width - pad * 2);

  const syF = (v: number) =>
    pad +
    (1 - (v - yRangeF.min) / (yRangeF.max - yRangeF.min)) * (H1 - pad * 2);

  const syD = (v: number) =>
    pad +
    (1 - (v - yRangeD.min) / (yRangeD.max - yRangeD.min)) * (H2 - pad * 2);

  const invX = (px: number, width: number) =>
    xMin + ((px - pad) / (width - pad * 2)) * (xMax - xMin);

  const curveF = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 700; i++) {
      const xx = xMin + (xMax - xMin) * (i / 700);
      pts.push([sx(xx, W), syF(f(xx))]);
    }
    return toPath(pts);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- syF/sx recreated each render
  }, [fnType, f, xMin, xMax]);

  const curveD = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 700; i++) {
      const xx = xMin + (xMax - xMin) * (i / 700);
      pts.push([sx(xx, W), syD(df(xx))]);
    }
    return toPath(pts);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- syD/sx recreated each render
  }, [fnType, df, xMin, xMax]);

  const tangentF = (a: number) => {
    const m = df(a);
    const y0 = f(a);
    const dx = 3.2;
    return toPath([
      [sx(a - dx, W), syF(m * -dx + y0)],
      [sx(a + dx, W), syF(m * dx + y0)],
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
    setZoom(1);
    setX(0);
    setXh(0.5);
  };

  const zoomIn = () =>
    setZoom((z) => Math.min(ZOOM_MAX, z * 1.15));
  const zoomOut = () =>
    setZoom((z) => Math.max(ZOOM_MIN, z / 1.15));
  const zoomReset = () => setZoom(1);

  const onMoveF = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const nx = clamp(invX(px, W), xMin, xMax);
    dragging.current === "x" ? setX(nx) : setXh(nx);
  };

  const onMoveD = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const nx = clamp(invX(px, W), xMin, xMax);
    dragging.current === "x" ? setX(nx) : setXh(nx);
  };

  const clearDragging = () => {
    dragging.current = null;
  };

  return (
    <div className="flex justify-center p-6 pt-2">
      <div className="w-[900px] max-w-full">
        <div className="rounded-[22px] bg-limitdiff-card border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.50)] overflow-hidden">
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

          <div className="p-4 bg-limitdiff-panel space-y-3.5">
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
            <FunctionGraph
              width={W}
              height={H1}
              pad={pad}
              xMin={xMin}
              xMax={xMax}
              yRangeF={yRangeF}
              sx={sx}
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
            />

            <DerivativeGraph
              width={W}
              height={H2}
              pad={pad}
              xMin={xMin}
              xMax={xMax}
              yRangeD={yRangeD}
              sx={sx}
              syD={syD}
              curveD={curveD}
              x={x}
              xh={xh}
              dfx={dfx}
              dfxh={dfxh}
              onMouseDownX={() => (dragging.current = "x")}
              onMouseDownXh={() => (dragging.current = "xh")}
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
