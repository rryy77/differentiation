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
  onReset: () => void;
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
  onReset,
  h,
  fx,
  fxh,
  secant,
  dfx,
  dfxh,
}: Props) {
  return (
    <div className="flex justify-between gap-3 p-4 bg-[rgba(15,23,42,0.5)] border-b border-white/15">
      <div className="flex gap-2.5 flex-wrap">
        <button
          className="rounded-full py-2.5 px-3 border border-white/15 bg-white/5 text-ui-base cursor-pointer font-semibold"
          onClick={() => setFnType("x2")}
        >
          x²
        </button>
        <button
          className="rounded-full py-2.5 px-3 border border-white/15 bg-white/5 text-ui-base cursor-pointer font-semibold"
          onClick={() => setFnType("x3")}
        >
          x³
        </button>
        <button
          className="rounded-full py-2.5 px-3 border border-white/15 bg-white/5 text-ui-base cursor-pointer font-semibold"
          onClick={() => setFnType("x4")}
        >
          x⁴
        </button>
        <button
          className="rounded-full py-2.5 px-3 border border-white/15 bg-white/5 text-ui-base cursor-pointer font-semibold"
          onClick={goLimit}
        >
          h → 0
        </button>
        <button
          className="rounded-full py-2.5 px-3 border border-white/15 bg-white/5 text-ui-base cursor-pointer font-semibold hover:bg-rose-500/20 hover:border-rose-400/30"
          onClick={onReset}
        >
          リセット
        </button>
      </div>

      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex gap-[18px] mt-3 items-center flex-wrap">
          <div className="min-w-[240px]">
            <div className="text-xs text-ui-muted tracking-wide">
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
            <div className="text-xs text-ui-muted tracking-wide">
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
          <div className="text-xs text-ui-muted tracking-wide">x</div>
          <div className="text-base text-ui-base tabular-nums">{fmt(x, 1)}</div>
        </div>
        <div>
          <div className="text-xs text-ui-muted tracking-wide">x+h</div>
          <div className="text-base text-ui-base tabular-nums">
            {fmt(xh, 1)}
          </div>
        </div>
        <div>
          <div className="text-xs text-ui-muted tracking-wide">f(x)</div>
          <div className="text-base text-ui-base tabular-nums">
            {fmt(fx, 1)}
          </div>
        </div>
        <div>
          <div className="text-xs text-ui-muted tracking-wide">f(x+h)</div>
          <div className="text-base text-ui-base tabular-nums">
            {fmt(fxh, 1)}
          </div>
        </div>
        <div>
          <div className="text-xs text-ui-muted tracking-wide">差分</div>
          <div className="text-base text-ui-base tabular-nums">
            {fmt(secant, 1)}
          </div>
        </div>
        <div>
          <div className="text-xs text-ui-muted tracking-wide">f'(x)</div>
          <div className="text-base text-ui-base tabular-nums">
            {fmt(dfx, 1)}
          </div>
        </div>
        <div>
          <div className="text-xs text-ui-muted tracking-wide">f'(x+h)</div>
          <div className="text-base text-ui-base tabular-nums">
            {fmt(dfxh, 1)}
          </div>
        </div>
      </div>
    </div>
  );
}
