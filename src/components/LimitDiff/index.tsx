import React, { useMemo, useRef, useState } from "react";
import type { FnType } from "./constants";
import { FUNCTIONS, EPS, LAYOUT } from "./constants";
import { toPath, clamp } from "./utils";
import { HeaderControls } from "./HeaderControls";
import { FunctionGraph } from "./FunctionGraph";
import { DerivativeGraph } from "./DerivativeGraph";

const { W, H1, H2, pad, xMin, xMax } = LAYOUT;

export default function LimitDiff() {
  const [fnType, setFnType] = useState<FnType>("x2");
  const [x, setX] = useState(0.6);
  const [xh, setXh] = useState(1.4);

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
  }, [f]);

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
  }, [df]);

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
  }, [fnType, f]);

  const curveD = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 700; i++) {
      const xx = xMin + (xMax - xMin) * (i / 700);
      pts.push([sx(xx, W), syD(df(xx))]);
    }
    return toPath(pts);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- syD/sx recreated each render
  }, [fnType, df]);

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
    <div className="min-h-screen bg-limitdiff-page flex justify-center p-6 font-sans">
      <div className="w-[900px] max-w-full">
        <div className="rounded-[22px] bg-limitdiff-card border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.50)] overflow-hidden">
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
            h={h}
            fx={fx}
            fxh={fxh}
            secant={secant}
            dfx={dfx}
            dfxh={dfxh}
          />

          <div className="p-4 bg-limitdiff-panel">
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
