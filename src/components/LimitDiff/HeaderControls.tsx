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
    <div className="flex justify-between gap-4 p-5 bg-limitdiff-panel border-b border-white/10">
      <div className="flex gap-3 flex-wrap">
        <button
          className={`rounded-xl py-2.5 px-4 border text-ui-base cursor-pointer font-semibold transition-all duration-200 ${
            fnType === "x2"
              ? "border-accent-cyan/60 bg-accent-cyan/20 text-white shadow-glow-cyan"
              : "border-white/20 bg-white/8 hover:bg-accent-cyan/10 hover:border-accent-cyan/40"
          }`}
          onClick={() => setFnType("x2")}
        >
          x²
        </button>
        <button
          className={`rounded-xl py-2.5 px-4 border text-ui-base cursor-pointer font-semibold transition-all duration-200 ${
            fnType === "x3"
              ? "border-accent-cyan/60 bg-accent-cyan/20 text-white shadow-glow-cyan"
              : "border-white/20 bg-white/8 hover:bg-accent-cyan/10 hover:border-accent-cyan/40"
          }`}
          onClick={() => setFnType("x3")}
        >
          x³
        </button>
        <button
          className={`rounded-xl py-2.5 px-4 border text-ui-base cursor-pointer font-semibold transition-all duration-200 ${
            fnType === "x4"
              ? "border-accent-cyan/60 bg-accent-cyan/20 text-white shadow-glow-cyan"
              : "border-white/20 bg-white/8 hover:bg-accent-cyan/10 hover:border-accent-cyan/40"
          }`}
          onClick={() => setFnType("x4")}
        >
          x⁴
        </button>
        <button
          className="rounded-xl py-2.5 px-4 border border-accent-purple/40 bg-accent-purple/15 text-accent-purple cursor-pointer font-semibold hover:bg-accent-purple/25 hover:shadow-glow-purple transition-all duration-200"
          onClick={goLimit}
        >
          h → 0
        </button>
        <button
          className="rounded-xl py-2.5 px-4 border border-white/20 bg-white/8 text-ui-base cursor-pointer font-semibold hover:bg-accent-pink/15 hover:border-accent-pink/40 hover:text-accent-pink transition-all duration-200"
          onClick={onReset}
        >
          リセット
        </button>
      </div>

      <div className="flex gap-5 flex-wrap items-center">
        <div className="flex gap-5 mt-2 items-center flex-wrap">
          <div className="min-w-[240px]">
            <div className="text-sm text-ui-muted tracking-wide font-medium mb-2">
              x（slider）
            </div>
            <input
              type="range"
              min={xMin}
              max={xMax}
              step={0.001}
              value={x}
              onChange={(e) => setX(Number(e.target.value))}
              className="w-full h-1.5 cursor-pointer"
            />
          </div>
          <div className="min-w-[240px]">
            <div className="text-sm text-ui-muted tracking-wide font-medium mb-2">
              x + h（slider）
            </div>
            <input
              type="range"
              min={xMin}
              max={xMax}
              step={0.001}
              value={xh}
              onChange={(e) => setXh(Number(e.target.value))}
              className="w-full h-1.5 cursor-pointer"
            />
          </div>
        </div>

        <div className="px-3 py-2 rounded-xl bg-white/8 border border-white/20">
          <div className="text-xs text-ui-muted tracking-wide font-medium">x</div>
          <div className="text-base text-accent-pink tabular-nums font-semibold">{fmt(x, 1)}</div>
        </div>
        <div className="px-3 py-2 rounded-xl bg-white/8 border border-white/20">
          <div className="text-xs text-ui-muted tracking-wide font-medium">x+h</div>
          <div className="text-base text-accent-green tabular-nums font-semibold">
            {fmt(xh, 1)}
          </div>
        </div>
        <div className="px-3 py-2 rounded-xl bg-white/8 border border-white/20">
          <div className="text-xs text-ui-muted tracking-wide font-medium">f(x)</div>
          <div className="text-base text-accent-cyan tabular-nums font-semibold">
            {fmt(fx, 1)}
          </div>
        </div>
        <div className="px-3 py-2 rounded-xl bg-white/8 border border-white/20">
          <div className="text-xs text-ui-muted tracking-wide font-medium">f(x+h)</div>
          <div className="text-base text-accent-cyan tabular-nums font-semibold">
            {fmt(fxh, 1)}
          </div>
        </div>
        <div className="px-3 py-2 rounded-xl bg-white/8 border border-white/20">
          <div className="text-xs text-ui-muted tracking-wide font-medium">差分</div>
          <div className="text-base text-accent-orange tabular-nums font-semibold">
            {fmt(secant, 1)}
          </div>
        </div>
        <div className="px-3 py-2 rounded-xl bg-white/8 border border-white/20">
          <div className="text-xs text-ui-muted tracking-wide font-medium">f'(x)</div>
          <div className="text-base text-accent-purple tabular-nums font-semibold">
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
