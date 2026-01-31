import React from "react";
import { GridLines } from "./GridLines";
import { strokeGrid, strokeAxis, colors } from "./theme";

type Props = {
  width: number;
  height: number;
  pad: number;
  xMin: number;
  xMax: number;
  yRangeF: { min: number; max: number };
  sx: (v: number, w: number) => number;
  syF: (v: number) => number;
  curveF: string;
  tangentF: (a: number) => string;
  x: number;
  xh: number;
  fx: number;
  fxh: number;
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onMouseDownX: () => void;
  onMouseDownXh: () => void;
};

export function FunctionGraph({
  width,
  height,
  pad,
  xMin,
  xMax,
  yRangeF,
  sx,
  syF,
  curveF,
  tangentF,
  x,
  xh,
  fx,
  fxh,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onMouseDownX,
  onMouseDownXh,
}: Props) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-[rgba(2,6,23,0.35)] p-3 overflow-x-auto">
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
          yMin={yRangeF.min}
          yMax={yRangeF.max}
          sx={sx}
          sy={syF}
          strokeGrid={strokeGrid}
          strokeAxis={strokeAxis}
        />

        <path d={curveF} stroke={colors.f} strokeWidth={2.3} fill="none" />
        <path
          d={tangentF(x)}
          stroke={colors.tanX}
          strokeWidth={2.8}
          fill="none"
          opacity={0.95}
        />
        <path
          d={tangentF(xh)}
          stroke={colors.tanXh}
          strokeWidth={2.8}
          fill="none"
          opacity={0.95}
        />

        <line
          x1={sx(x, width)}
          y1={syF(fx)}
          x2={sx(xh, width)}
          y2={syF(fxh)}
          stroke={colors.sec}
          strokeWidth={2.2}
          opacity={0.95}
        />

        <circle
          cx={sx(x, width)}
          cy={syF(fx)}
          r={7}
          fill={colors.x}
          onPointerDown={onMouseDownX}
          className="cursor-grab"
        />
        <circle
          cx={sx(xh, width)}
          cy={syF(fxh)}
          r={7}
          fill={colors.xh}
          onPointerDown={onMouseDownXh}
          className="cursor-grab"
        />

        <circle
          cx={sx(x, width)}
          cy={syF(fx)}
          r={14}
          fill={colors.x}
          opacity={0.12}
        />
        <circle
          cx={sx(xh, width)}
          cy={syF(fxh)}
          r={14}
          fill={colors.xh}
          opacity={0.1}
        />
      </svg>
    </div>
  );
}
