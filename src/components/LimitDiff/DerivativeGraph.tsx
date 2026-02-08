import React, { useEffect, useRef } from "react";
import { GridLines, strokeGrid, strokeAxis, colors } from "../../shared";

type Props = {
  width: number;
  height: number;
  pad: number;
  xMin: number;
  xMax: number;
  yRangeD: { min: number; max: number };
  sx: (v: number, w: number) => number;
  syD: (v: number) => number;
  curveD: string;
  x: number;
  xh: number;
  dfx: number;
  dfxh: number;
  onMouseDownX: () => void;
  onMouseDownXh: () => void;
  onPointerDownBackground?: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onWheel?: (e: React.WheelEvent<SVGSVGElement>) => void;
  onPinchZoom?: (
    e: React.TouchEvent<SVGSVGElement>,
    type: "start" | "move" | "end"
  ) => void;
};

export function DerivativeGraph({
  width,
  height,
  pad,
  xMin,
  xMax,
  yRangeD,
  sx,
  syD,
  curveD,
  x,
  xh,
  dfx,
  dfxh,
  onMouseDownX,
  onMouseDownXh,
  onPointerDownBackground,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onWheel,
  onPinchZoom,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = svgRef.current;
    if (!el || !onWheel) return;
    const handler = (e: WheelEvent) => {
      onWheel(e as unknown as React.WheelEvent<SVGSVGElement>);
      e.preventDefault();
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [onWheel]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el || !onPinchZoom) return;
    const start = (e: TouchEvent) =>
      onPinchZoom(e as unknown as React.TouchEvent<SVGSVGElement>, "start");
    const move = (e: TouchEvent) => {
      onPinchZoom(e as unknown as React.TouchEvent<SVGSVGElement>, "move");
      if (e.touches.length === 2) e.preventDefault();
    };
    const end = (e: TouchEvent) =>
      onPinchZoom(e as unknown as React.TouchEvent<SVGSVGElement>, "end");
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end, { passive: true });
    el.addEventListener("touchcancel", end, { passive: true });
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [onPinchZoom]);

  return (
    <div className="mt-3.5 rounded-[18px] border border-white/15 bg-[rgba(15,23,42,0.5)] p-3 overflow-hidden">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onPointerDown={onPointerDownBackground}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onWheel={onWheel}
        className="block touch-none cursor-grab active:cursor-grabbing"
      >
        <rect
          width={width}
          height={height}
          fill="transparent"
          style={{ pointerEvents: "none" }}
        />
        <GridLines
          width={width}
          height={height}
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
          style={{ filter: "drop-shadow(0 0 4px rgba(192,132,252,0.35))" }}
        />
        <circle cx={sx(x, width)} cy={syD(dfx)} r={6} fill={colors.x} />
        <circle
          cx={sx(xh, width)}
          cy={syD(dfxh)}
          r={6}
          fill={colors.xh}
          opacity={0.9}
        />

        <circle
          cx={sx(x, width)}
          cy={syD(dfx)}
          r={14}
          fill={colors.x}
          opacity={0.08}
          onPointerDown={(e) => {
            e.stopPropagation();
            onMouseDownX();
          }}
          className="cursor-grab"
        />
        <circle
          cx={sx(xh, width)}
          cy={syD(dfxh)}
          r={14}
          fill={colors.xh}
          opacity={0.06}
          onPointerDown={(e) => {
            e.stopPropagation();
            onMouseDownXh();
          }}
          className="cursor-grab"
        />

        <text
          x={sx(x, width) + 10}
          y={syD(dfx) + 4}
          textAnchor="start"
          style={{ fontSize: 11, fill: "rgba(255,255,255,0.7)", fontFamily: "system-ui" }}
        >
          ({x.toFixed(1)}, {dfx.toFixed(1)})
        </text>
        <text
          x={sx(xh, width) + 10}
          y={syD(dfxh) + 4}
          textAnchor="start"
          style={{ fontSize: 11, fill: "rgba(255,255,255,0.7)", fontFamily: "system-ui" }}
        >
          ({xh.toFixed(1)}, {dfxh.toFixed(1)})
        </text>
      </svg>
    </div>
  );
}
