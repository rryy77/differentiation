import React from "react";
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
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
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
  onPointerMove,
  onPointerUp,
  onPointerLeave,
}: Props) {
  return (
    <div className="mt-3.5 rounded-[18px] border border-white/15 bg-[rgba(15,23,42,0.5)] p-3 overflow-x-auto">
      <svg
        width={width}
        height={height}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        className="block touch-none"
      >
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

        <path d={curveD} stroke={colors.d} strokeWidth={2.3} fill="none" />
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
          onPointerDown={onMouseDownX}
          className="cursor-grab"
        />
        <circle
          cx={sx(xh, width)}
          cy={syD(dfxh)}
          r={14}
          fill={colors.xh}
          opacity={0.06}
          onPointerDown={onMouseDownXh}
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
