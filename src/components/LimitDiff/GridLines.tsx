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
      />,
    );
  }

  return <>{lines}</>;
}
