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
const X_SPAN_MAX = 40;
/** 初期表示は縮小（広め）にして毎回探す手間を省く */
const DEFAULT_X_SPAN = 10;
const Y_SPAN_MIN = 0.5;
const Y_SPAN_MAX = 15;
const PAN_FACTOR = 0.5;

export default function LimitDiff() {
  const [fnType, setFnType] = useState<FnType>("x2");
  const [x, setX] = useState(0.6);
  const [xh, setXh] = useState(1.4);
  const [xSpan, setXSpan] = useState(DEFAULT_X_SPAN);
  const [panXF, setPanXF] = useState(0);
  const [panYF, setPanYF] = useState(0);
  const [panXD, setPanXD] = useState(0);
  const [panYD, setPanYD] = useState(0);
  const [ySpanF, setYSpanF] = useState(4);
  const [ySpanD, setYSpanD] = useState(4);
  const [displayYSpanF, setDisplayYSpanF] = useState(4);
  const [displayYSpanD, setDisplayYSpanD] = useState(4);
  const ySpanRafRef = useRef<number | undefined>(undefined);
  const ySpanDoneFRef = useRef(false);
  const ySpanDoneDRef = useRef(false);

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
    // 毎回探さないよう、縮小（広め）を保つ：少なくとも DEFAULT_X_SPAN は確保
    newXSpan = Math.max(DEFAULT_X_SPAN, newXSpan);
    setXSpan(newXSpan);
    const centerX = (xLo + xHi) / 2;
    const centerY = (yLo + yHi) / 2;
    setPanXF(centerX);
    setPanXD(centerX);
    setPanYF(centerY);
    setPanYD(centerY);
    const aspectF = (H1 - pad * 2) / (W - pad * 2);
    const aspectD = (H2 - pad * 2) / (W - pad * 2);
    setYSpanF(aspectF * newXSpan);
    setYSpanD(aspectD * newXSpan);
    setDisplayYSpanF(aspectF * newXSpan);
    setDisplayYSpanD(aspectD * newXSpan);
  }, [fnType, f, df]);

  const dragging = useRef<"x" | "xh" | "pan" | null>(null);
  const lastPan = useRef({ x: 0, y: 0 });
  const panCaptureRef = useRef<{ el: Element; pointerId: number } | null>(null);
  const [isPanningOrZooming, setIsPanningOrZooming] = useState(false);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markActive = () => {
    setIsPanningOrZooming(true);
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => {
      setIsPanningOrZooming(false);
      idleRef.current = null;
    }, 180);
  };

  useEffect(() => () => { if (idleRef.current) clearTimeout(idleRef.current); }, []);

  useEffect(() => {
    const step = () => {
      ySpanDoneFRef.current = false;
      ySpanDoneDRef.current = false;
      setDisplayYSpanF((prev) => {
        const next = prev + (ySpanF - prev) * 0.18;
        ySpanDoneFRef.current = Math.abs(next - ySpanF) < 0.05;
        return Math.abs(next - ySpanF) < 0.05 ? ySpanF : next;
      });
      setDisplayYSpanD((prev) => {
        const next = prev + (ySpanD - prev) * 0.18;
        ySpanDoneDRef.current = Math.abs(next - ySpanD) < 0.05;
        return Math.abs(next - ySpanD) < 0.05 ? ySpanD : next;
      });
      ySpanRafRef.current = requestAnimationFrame(() => {
        if (!ySpanDoneFRef.current || !ySpanDoneDRef.current) step();
      });
    };
    ySpanRafRef.current = requestAnimationFrame(step);
    return () => {
      if (ySpanRafRef.current) cancelAnimationFrame(ySpanRafRef.current);
    };
  }, [ySpanF, ySpanD]);

  const yRangeF = useMemo(
    () => ({
      min: panYF - displayYSpanF / 2,
      max: panYF + displayYSpanF / 2,
    }),
    [panYF, displayYSpanF]
  );

  const yRangeD = useMemo(
    () => ({
      min: panYD - displayYSpanD / 2,
      max: panYD + displayYSpanD / 2,
    }),
    [panYD, displayYSpanD]
  );

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

  const curveSamples = isPanningOrZooming ? 200 : 700;

  const curveF = useMemo(() => {
    const pts: [number, number][] = [];
    const n = curveSamples;
    for (let i = 0; i <= n; i++) {
      const xx = xMinF + (xMaxF - xMinF) * (i / n);
      pts.push([sxF(xx, W), syF(f(xx))]);
    }
    return toPath(pts);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- syF/sxF recreated each render
  }, [fnType, f, xMinF, xMaxF, yRangeF.min, yRangeF.max, curveSamples]);

  const curveD = useMemo(() => {
    const pts: [number, number][] = [];
    const n = curveSamples;
    for (let i = 0; i <= n; i++) {
      const xx = xMinD + (xMaxD - xMinD) * (i / n);
      pts.push([sxD(xx, W), syD(df(xx))]);
    }
    return toPath(pts);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- syD/sxD recreated each render
  }, [fnType, df, xMinD, xMaxD, yRangeD.min, yRangeD.max, curveSamples]);

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

  const aspectF = (H1 - pad * 2) / (W - pad * 2);
  const aspectD = (H2 - pad * 2) / (W - pad * 2);

  const reset = () => {
    setFnType("x2");
    setXSpan(DEFAULT_X_SPAN);
    setPanXF(0);
    setPanYF(0);
    setPanXD(0);
    setPanYD(0);
    const newF = aspectF * DEFAULT_X_SPAN;
    const newD = aspectD * DEFAULT_X_SPAN;
    setYSpanF(newF);
    setYSpanD(newD);
    setDisplayYSpanF(newF);
    setDisplayYSpanD(newD);
    setX(0);
    setXh(0.5);
  };

  const ZOOM_STEP = 1.4;
  const xSpanIn = () => {
    setXSpan((s) => Math.min(X_SPAN_MAX, s * ZOOM_STEP));
    setYSpanF((s) => Math.min(Y_SPAN_MAX, s * ZOOM_STEP));
    setYSpanD((s) => Math.min(Y_SPAN_MAX, s * ZOOM_STEP));
  };
  const xSpanOut = () => {
    setXSpan((s) => Math.max(X_SPAN_MIN, s / ZOOM_STEP));
    setYSpanF((s) => Math.max(Y_SPAN_MIN, s / ZOOM_STEP));
    setYSpanD((s) => Math.max(Y_SPAN_MIN, s / ZOOM_STEP));
  };
  const xSpanReset = () => {
    setXSpan(DEFAULT_X_SPAN);
    setYSpanF(aspectF * DEFAULT_X_SPAN);
    setYSpanD(aspectD * DEFAULT_X_SPAN);
  };
  const ySpanIn = () => {
    setYSpanF((s) => Math.min(Y_SPAN_MAX, s * ZOOM_STEP));
    setYSpanD((s) => Math.min(Y_SPAN_MAX, s * ZOOM_STEP));
  };
  const ySpanOut = () => {
    setYSpanF((s) => Math.max(Y_SPAN_MIN, s / ZOOM_STEP));
    setYSpanD((s) => Math.max(Y_SPAN_MIN, s / ZOOM_STEP));
  };
  const ySpanReset = () => {
    const aspectF = (H1 - pad * 2) / (W - pad * 2);
    const aspectD = (H2 - pad * 2) / (W - pad * 2);
    const newF = aspectF * DEFAULT_X_SPAN;
    const newD = aspectD * DEFAULT_X_SPAN;
    setYSpanF(newF);
    setYSpanD(newD);
    setDisplayYSpanF(newF);
    setDisplayYSpanD(newD);
  };

  const onWheelZoom = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    markActive();
    const rect = e.currentTarget.getBoundingClientRect();
    const cursorPx = e.clientX - rect.left;
    const drawW = W - pad * 2;
    const cursorX_data = panXF - xSpan / 2 + ((cursorPx - pad) / drawW) * xSpan;
    const factor = 1 + e.deltaY * 0.005;
    const newXSpan = Math.max(
      X_SPAN_MIN,
      Math.min(X_SPAN_MAX, xSpan * factor)
    );
    const newPanX = cursorX_data + newXSpan * (0.5 - (cursorPx - pad) / drawW);
    const scale = newXSpan / xSpan;
    setXSpan(newXSpan);
    setPanXF(newPanX);
    setPanXD(newPanX);
    setYSpanF((s) => s * scale);
    setYSpanD((s) => s * scale);
  };

  const pinchRef = useRef<{
    distance: number;
    xSpan: number;
    panXF: number;
    centerX_data: number;
    centerPx: number;
  } | null>(null);

  const onPinchZoom = (
    e: React.TouchEvent<SVGSVGElement>,
    type: "start" | "move" | "end"
  ) => {
    const touches = e.touches;
    if (type === "end" || touches.length < 2) {
      pinchRef.current = null;
      return;
    }
    if (touches.length !== 2) return;
    e.preventDefault();
    markActive();
    const rect = e.currentTarget.getBoundingClientRect();
    const px1 = touches[0].clientX - rect.left;
    const py1 = touches[0].clientY - rect.top;
    const px2 = touches[1].clientX - rect.left;
    const py2 = touches[1].clientY - rect.top;
    const centerPx = (px1 + px2) / 2;
    const distance = Math.hypot(px2 - px1, py2 - py1) || 1;
    const drawW = W - pad * 2;

    if (type === "start") {
      const centerX_data = panXF - xSpan / 2 + ((centerPx - pad) / drawW) * xSpan;
      pinchRef.current = {
        distance,
        xSpan,
        panXF,
        centerX_data,
        centerPx,
      };
      return;
    }
    const prev = pinchRef.current;
    if (!prev) return;
    const zoomFactor = distance / prev.distance;
    const newXSpan = Math.max(
      X_SPAN_MIN,
      Math.min(X_SPAN_MAX, prev.xSpan * zoomFactor)
    );
    const newPanX =
      prev.centerX_data +
      newXSpan * (0.5 - (centerPx - pad) / drawW);
    const scale = newXSpan / prev.xSpan;
    setXSpan(newXSpan);
    setPanXF(newPanX);
    setPanXD(newPanX);
    setYSpanF((s) => s * scale);
    setYSpanD((s) => s * scale);
    pinchRef.current = {
      ...prev,
      distance,
      xSpan: newXSpan,
      panXF: newPanX,
    };
  };

  const onPanStartF = (e: React.PointerEvent) => {
    if (dragging.current) return;
    if ((e.target as SVGElement).tagName === "line") return;
    dragging.current = "pan";
    lastPan.current = { x: e.clientX, y: e.clientY };
    const el = e.currentTarget as Element;
    el.setPointerCapture?.(e.pointerId);
    panCaptureRef.current = { el, pointerId: e.pointerId };
    markActive();
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
      const dxData = (moveX / drawW) * (xMaxF - xMinF) * PAN_FACTOR;
      setPanXF((p) => p - dxData);
      setPanXD((p) => p - dxData);
      const dyData = -(moveY / drawH) * (yRangeF.max - yRangeF.min) * PAN_FACTOR;
      setPanYF((p) => p - dyData);
      setPanYD((p) => p - dyData);
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
    const el = e.currentTarget as Element;
    el.setPointerCapture?.(e.pointerId);
    panCaptureRef.current = { el, pointerId: e.pointerId };
    markActive();
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
      const dxData = (moveX / drawW) * (xMaxD - xMinD) * PAN_FACTOR;
      setPanXF((p) => p - dxData);
      setPanXD((p) => p - dxData);
      const dyData = -(moveY / drawH) * (yRangeD.max - yRangeD.min) * PAN_FACTOR;
      setPanYF((p) => p - dyData);
      setPanYD((p) => p - dyData);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const nx = clamp(invXD(px, W), xMinD, xMaxD);
    dragging.current === "x" ? setX(nx) : setXh(nx);
  };

  const clearDragging = () => {
    const cap = panCaptureRef.current;
    if (cap) {
      try {
        cap.el.releasePointerCapture(cap.pointerId);
      } catch {
        /* already released */
      }
      panCaptureRef.current = null;
    }
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
            <p className="text-xs text-ui-dim text-right">
              x-y座標の上にグラフを表示。Figmaのようにドラッグで上下左右に移動・スクロール／ピンチで拡大縮小
            </p>
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
              onWheel={onWheelZoom}
              onPinchZoom={onPinchZoom}
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
              onWheel={onWheelZoom}
              onPinchZoom={onPinchZoom}
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
