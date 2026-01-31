import React from "react";
import type { FnType } from "./constants";
import { fmt } from "./utils";

type Props = {
  fnType: FnType;
  setFnType: (t: FnType) => void;
  x: number;
  setX: (v: number) => void;
  xh: number;
  setXh: (v: number) => void;
  xMin: number;
  xMax: number;
  goLimit: () => void;
  h: number;
  fx: number;
  fxh: number;
  secant: number;
  dfx: number;
  dfxh: number;
};

export function HeaderControls({
  fnType,
  setFnType,
  x,
  setX,
  xh,
  setXh,
  xMin,
  xMax,
  goLimit,
  h,
  fx,
  fxh,
  secant,
  dfx,
  dfxh,
}: Props) {
  return (
    <div className="flex justify-between gap-3 p-4 bg-[rgba(2,6,23,0.35)] border-b border-white/10">
      <div className="flex gap-2.5 flex-wrap">
        <button
          className="rounded-full py-2.5 px-3 border border-white/10 bg-white/5 text-gray-200 cursor-pointer font-semibold"
          onClick={() => setFnType("x2")}
        >
          x²
        </button>
        <button
          className="rounded-full py-2.5 px-3 border border-white/10 bg-white/5 text-gray-200 cursor-pointer font-semibold"
          onClick={() => setFnType("x3")}
        >
          x³
        </button>
        <button
          className="rounded-full py-2.5 px-3 border border-white/10 bg-white/5 text-gray-200 cursor-pointer font-semibold"
          onClick={goLimit}
        >
          h → 0
        </button>
      </div>

      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex gap-[18px] mt-3 items-center flex-wrap">
          <div className="min-w-[240px]">
            <div className="text-xs text-gray-300/80 tracking-wide">
              x（slider）
            </div>
            <input
              type="range"
              min={xMin}
              max={xMax}
              step={0.001}
              value={x}
              onChange={(e) => setX(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="min-w-[240px]">
            <div className="text-xs text-gray-300/80 tracking-wide">
              x + h（slider）
            </div>
            <input
              type="range"
              min={xMin}
              max={xMax}
              step={0.001}
              value={xh}
              onChange={(e) => setXh(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-300/80 tracking-wide">x</div>
          <div className="text-base text-gray-200 tabular-nums">
            {fmt(x, 4)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-300/80 tracking-wide">x+h</div>
          <div className="text-base text-gray-200 tabular-nums">
            {fmt(xh, 4)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-300/80 tracking-wide">h</div>
          <div className="text-base text-gray-200 tabular-nums">
            {h.toExponential(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-300/80 tracking-wide">f(x)</div>
          <div className="text-base text-gray-200 tabular-nums">
            {fmt(fx, 4)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-300/80 tracking-wide">f(x+h)</div>
          <div className="text-base text-gray-200 tabular-nums">
            {fmt(fxh, 4)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-300/80 tracking-wide">差分商</div>
          <div className="text-base text-gray-200 tabular-nums">
            {fmt(secant, 4)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-300/80 tracking-wide">f'(x)</div>
          <div className="text-base text-gray-200 tabular-nums">
            {fmt(dfx, 4)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-300/80 tracking-wide">f'(x+h)</div>
          <div className="text-base text-gray-200 tabular-nums">
            {fmt(dfxh, 4)}
          </div>
        </div>
      </div>
    </div>
  );
}
