import React from "react";

type Props = {
  width: number;
  height: number;
  pad: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  sx: (v: number, w: number) => number;
  sy: (v: number) => number;
  strokeGrid: string;
  strokeAxis: string;
};

const TICK_LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fill: "rgba(255,255,255,0.82)",
  fontFamily: "system-ui, sans-serif",
};

/** 目標本数に近い目盛りになる「きりの良い」ステップを返す（1,2,5,10,20,...） */
function niceTickStep(range: number, targetCount: number): number {
  if (range <= 0 || !Number.isFinite(range)) return 1;
  let step = range / Math.max(1, targetCount);
  const magnitude = 10 ** Math.floor(Math.log10(step));
  const normalized = step / magnitude;
  const nice =
    magnitude *
    (normalized <= 1.5 ? 1 : normalized <= 3 ? 2 : normalized <= 7 ? 5 : 10);
  return Math.max(0.001, nice);
}

/** 軸ラベル用に値を短く表示（整数ならそのまま、大きいなら指数や省略） */
function formatTickLabel(v: number): string {
  if (!Number.isFinite(v)) return "?";
  if (Math.abs(v) >= 1e4 || (Math.abs(v) < 0.001 && v !== 0))
    return v.toExponential(0);
  if (Number.isInteger(v)) return String(v);
  const s = v.toPrecision(4);
  return parseFloat(s).toString();
}

export function GridLines({
  width,
  height,
  pad,
  xMin,
  xMax,
  yMin,
  yMax,
  sx,
  sy,
  strokeGrid,
  strokeAxis,
}: Props) {
  const lines: React.ReactNode[] = [];

  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    const y = pad + t * (height - pad * 2);
    lines.push(
      <line
        key={`g-${i}`}
        x1={pad}
        y1={y}
        x2={width - pad}
        y2={y}
        stroke={strokeGrid}
        strokeWidth={0.8}
      />,
    );
  }

  if (yMin <= 0 && 0 <= yMax) {
    lines.push(
      <line
        key="axis-x"
        x1={pad}
        y1={sy(0)}
        x2={width - pad}
        y2={sy(0)}
        stroke={strokeAxis}
        strokeWidth={1.2}
      />,
    );
  }
  if (xMin <= 0 && 0 <= xMax) {
    lines.push(
      <line
        key="axis-y"
        x1={sx(0, width)}
        y1={pad}
        x2={sx(0, width)}
        y2={height - pad}
        stroke={strokeAxis}
        strokeWidth={1.2}
      />,
    );
  }

  const tickLen = 5;
  const xRange = xMax - xMin;
  const yRange = yMax - yMin;
  const targetTickCount = 8;

  // x軸: 範囲が大きいときはきりの良いステップで、x軸の本数を適度に
  const xStep =
    xRange <= 12 ? 1 : niceTickStep(xRange, targetTickCount);
  let x = Math.floor(xMin / xStep) * xStep;
  for (; x <= xMax + 1e-9; x += xStep) {
    const px = sx(x, width);
    if (px < pad || px > width - pad) continue;
    const bottomY = height - pad;
    lines.push(
      <line
        key={`tx-${x}`}
        x1={px}
        y1={bottomY}
        x2={px}
        y2={bottomY + tickLen}
        stroke={strokeAxis}
        strokeWidth={1}
      />,
    );
    lines.push(
      <text
        key={`tx-label-${x}`}
        x={px}
        y={bottomY + 18}
        textAnchor="middle"
        style={TICK_LABEL_STYLE}
      >
        {formatTickLabel(x)}
      </text>,
    );
  }

  // y軸: x軸と同程度の本数になるようきりの良いステップで（感覚を合わせる）
  const yStep = niceTickStep(yRange, targetTickCount);
  let y = Math.floor(yMin / yStep) * yStep;
  const axisX = xMin <= 0 && 0 <= xMax ? sx(0, width) : pad;
  for (; y <= yMax + 1e-9; y += yStep) {
    const py = sy(y);
    if (py < pad || py > height - pad) continue;
    lines.push(
      <line
        key={`ty-${y}`}
        x1={axisX}
        y1={py}
        x2={axisX - tickLen}
        y2={py}
        stroke={strokeAxis}
        strokeWidth={1}
      />,
    );
    lines.push(
      <text
        key={`ty-label-${y}`}
        x={axisX - 6}
        y={py + 4}
        textAnchor="end"
        style={TICK_LABEL_STYLE}
      >
        {formatTickLabel(y)}
      </text>,
    );
  }

  return <>{lines}</>;
}
