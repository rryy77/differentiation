import React from "react";

/** 分数を縦書き（分子／横線／分母）で表示 */
function VerticalFraction({
  num,
  den,
}: {
  num: string;
  den: string;
}) {
  return (
    <span className="inline-flex flex-col items-center justify-center align-middle leading-none">
      <span className="text-[0.95em]">{num}</span>
      <span className="text-[0.7em] leading-none" aria-hidden>ー</span>
      <span className="text-[0.95em]">{den}</span>
    </span>
  );
}

/**
 * 数式文字列を表示。分数 (例: 1/3, -2/5) は縦書きで表示する。
 */
export function FormulaText({ text }: { text: string }) {
  const parts = text.split(/(-?\d+)\/(\d+)/);
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    nodes.push(parts[i]);
    if (i + 2 < parts.length) {
      nodes.push(
        <VerticalFraction key={`${i}-${parts[i + 1]}-${parts[i + 2]}`} num={parts[i + 1]} den={parts[i + 2]} />
      );
      i += 2;
    }
  }
  return <span className="inline-flex flex-wrap items-baseline gap-px">{nodes}</span>;
}
