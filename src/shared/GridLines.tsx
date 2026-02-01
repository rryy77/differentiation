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

  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
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
        {Math.abs(x)}
      </text>,
    );
  }

  const axisX = xMin <= 0 && 0 <= xMax ? sx(0, width) : pad;
  const yStep = (yMax - yMin) / 4;
  for (let i = 0; i <= 4; i++) {
    const y = yMin + i * yStep;
    const py = sy(y);
    if (py < pad || py > height - pad) continue;
    lines.push(
      <line
        key={`ty-${i}`}
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
        key={`ty-label-${i}`}
        x={axisX - 6}
        y={py + 4}
        textAnchor="end"
        style={TICK_LABEL_STYLE}
      >
        {Math.round(Math.abs(y))}
      </text>,
    );
  }

  return <>{lines}</>;
}
