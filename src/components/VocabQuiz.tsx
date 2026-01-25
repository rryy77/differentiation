import React, { JSX, useMemo, useRef, useState } from "react";

type FnType = "x2" | "x3";

const FUNCTIONS = {
  x2: { f: (x: number) => x * x, df: (x: number) => 2 * x },
  x3: { f: (x: number) => x * x * x, df: (x: number) => 3 * x * x },
};

type Point = [number, number];
const EPS = 1e-6;

const toPath = (pts: Point[]) =>
  pts.reduce(
    (d, [x, y], i) =>
      d + `${i === 0 ? "M" : " L"} ${x.toFixed(2)} ${y.toFixed(2)}`,
    "",
  );

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const fmt = (n: number, d = 4) => (Number.isFinite(n) ? n.toFixed(d) : "NaN");

export default function LimitDiff() {
  const [fnType, setFnType] = useState<FnType>("x2");
  const [x, setX] = useState(0.6);
  const [xh, setXh] = useState(1.4);

  const f = FUNCTIONS[fnType].f;
  const df = FUNCTIONS[fnType].df;

  const dragging = useRef<"x" | "xh" | null>(null);

  /** layout */
  const W = 780;
  const H1 = 290; // f(x)
  const H2 = 220; // f'(x)
  const pad = 52;

  const xMin = -3;
  const xMax = 3;

  /** y ranges (separate for clarity) */
  const yRangeF = useMemo(() => {
    const vals: number[] = [];
    for (let i = 0; i <= 500; i++) {
      const xx = xMin + (xMax - xMin) * (i / 500);
      vals.push(f(xx));
    }
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const m = (max - min) * 0.18 + 0.8;
    return { min: min - m, max: max + m };
  }, [fnType]);

  const yRangeD = useMemo(() => {
    const vals: number[] = [];
    for (let i = 0; i <= 500; i++) {
      const xx = xMin + (xMax - xMin) * (i / 500);
      vals.push(df(xx));
    }
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const m = (max - min) * 0.22 + 0.8;
    return { min: min - m, max: max + m };
  }, [fnType]);

  const sx = (v: number, width: number) =>
    pad + ((v - xMin) / (xMax - xMin)) * (width - pad * 2);

  const syF = (v: number) =>
    pad +
    (1 - (v - yRangeF.min) / (yRangeF.max - yRangeF.min)) * (H1 - pad * 2);

  const syD = (v: number) =>
    pad +
    (1 - (v - yRangeD.min) / (yRangeD.max - yRangeD.min)) * (H2 - pad * 2);

  const invX = (px: number, width: number) =>
    xMin + ((px - pad) / (width - pad * 2)) * (xMax - xMin);

  /** curves */
  const curveF = useMemo(() => {
    const pts: Point[] = [];
    for (let i = 0; i <= 700; i++) {
      const xx = xMin + (xMax - xMin) * (i / 700);
      pts.push([sx(xx, W), syF(f(xx))]);
    }
    return toPath(pts);
  }, [fnType]);

  const curveD = useMemo(() => {
    const pts: Point[] = [];
    for (let i = 0; i <= 700; i++) {
      const xx = xMin + (xMax - xMin) * (i / 700);
      pts.push([sx(xx, W), syD(df(xx))]);
    }
    return toPath(pts);
  }, [fnType]);

  /** tangents (longer) */
  const tangentF = (a: number) => {
    const m = df(a);
    const y0 = f(a);
    const dx = 3.2; // longer than before
    return toPath([
      [sx(a - dx, W), syF(m * -dx + y0)],
      [sx(a + dx, W), syF(m * dx + y0)],
    ]);
  };

  /** values */
  const h = xh - x;
  const fx = f(x);
  const fxh = f(xh);
  const secant = Math.abs(h) < EPS ? NaN : (fxh - fx) / h;
  const dfx = df(x);
  const dfxh = df(xh);

  /** actions */
  const goLimit = () => setXh(x + Math.sign(h || 1) * EPS);

  /** drag handlers */
  const onMoveF = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const nx = clamp(invX(px, W), xMin, xMax);
    dragging.current === "x" ? setX(nx) : setXh(nx);
  };

  const onMoveD = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const nx = clamp(invX(px, W), xMin, xMax);
    dragging.current === "x" ? setX(nx) : setXh(nx);
  };

  /** style (modern, not too black) */
  const bg =
    "radial-gradient(1200px 700px at 30% -10%, rgba(99,102,241,0.35), transparent 55%), radial-gradient(1000px 600px at 90% 0%, rgba(34,211,238,0.24), transparent 55%), linear-gradient(180deg, #0b1020 0%, #070a14 100%)";

  const cardBg =
    "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))";

  const panelBg =
    "linear-gradient(180deg, rgba(2,6,23,0.65), rgba(2,6,23,0.35))";

  const strokeGrid = "rgba(255,255,255,0.08)";
  const strokeAxis = "rgba(255,255,255,0.16)";

  // colors
  const cF = "#22d3ee"; // function
  const cD = "#c084fc"; // derivative
  const cTanX = "#38bdf8"; // tangent at x
  const cTanXh = "#4ade80"; // tangent at x+h
  const cSec = "#fbbf24"; // secant
  const cX = "#fb7185"; // point x
  const cXh = "#22c55e"; // point x+h

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "rgba(229,231,235,0.75)",
    letterSpacing: 0.2,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 16,
    color: "#e5e7eb",
    fontVariantNumeric: "tabular-nums",
  };

  const pill: React.CSSProperties = {
    borderRadius: 999,
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontWeight: 600,
  };

  const miniPill: React.CSSProperties = {
    borderRadius: 999,
    padding: "8px 10px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontWeight: 600,
  };

  const gridLines = (
    height: number,
    sy: (v: number) => number,
    yMin: number,
    yMax: number,
  ) => {
    // 5 horizontal guides
    const lines: JSX.Element[] = [];
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      const y = pad + t * (height - pad * 2);
      lines.push(
        <line
          key={`g-${i}`}
          x1={pad}
          y1={y}
          x2={W - pad}
          y2={y}
          stroke={strokeGrid}
        />,
      );
    }
    // axis lines if in range
    if (yMin <= 0 && 0 <= yMax) {
      lines.push(
        <line
          key="axis-x"
          x1={pad}
          y1={sy(0)}
          x2={W - pad}
          y2={sy(0)}
          stroke={strokeAxis}
        />,
      );
    }
    if (xMin <= 0 && 0 <= xMax) {
      lines.push(
        <line
          key="axis-y"
          x1={sx(0, W)}
          y1={pad}
          x2={sx(0, W)}
          y2={height - pad}
          stroke={strokeAxis}
        />,
      );
    }
    return lines;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        display: "flex",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui",
      }}
    >
      <div style={{ width: 900, maxWidth: "100%" }}>
        {/* top card */}
        <div
          style={{
            borderRadius: 22,
            background: cardBg,
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.50)",
            overflow: "hidden",
          }}
        >
          {/* header controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              padding: 16,
              background: "rgba(2,6,23,0.35)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={pill} onClick={() => setFnType("x2")}>
                x²
              </button>
              <button style={pill} onClick={() => setFnType("x3")}>
                x³
              </button>
              <button style={pill} onClick={goLimit}>
                h → 0
              </button>
            </div>

            {/* value strip (numbers only) */}
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div>
                <div style={labelStyle}>x</div>
                <div style={valueStyle}>{fmt(x, 4)}</div>
              </div>
              <div>
                <div style={labelStyle}>x+h</div>
                <div style={valueStyle}>{fmt(xh, 4)}</div>
              </div>
              <div>
                <div style={labelStyle}>h</div>
                <div style={valueStyle}>{h.toExponential(2)}</div>
              </div>
              <div>
                <div style={labelStyle}>f(x)</div>
                <div style={valueStyle}>{fmt(fx, 4)}</div>
              </div>
              <div>
                <div style={labelStyle}>f(x+h)</div>
                <div style={valueStyle}>{fmt(fxh, 4)}</div>
              </div>
              <div>
                <div style={labelStyle}>差分商</div>
                <div style={valueStyle}>{fmt(secant, 4)}</div>
              </div>
              <div>
                <div style={labelStyle}>f'(x)</div>
                <div style={valueStyle}>{fmt(dfx, 4)}</div>
              </div>
              <div>
                <div style={labelStyle}>f'(x+h)</div>
                <div style={valueStyle}>{fmt(dfxh, 4)}</div>
              </div>
            </div>
          </div>

          {/* graphs container */}
          <div style={{ padding: 16, background: panelBg }}>
            {/* graph 1: f(x) */}
            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(2,6,23,0.35)",
                padding: 12,
              }}
            >
              <svg
                width={W}
                height={H1}
                onPointerMove={onMoveF}
                onPointerUp={() => (dragging.current = null)}
                onPointerLeave={() => (dragging.current = null)}
                style={{ display: "block", touchAction: "none" }}
              >
                {gridLines(H1, syF, yRangeF.min, yRangeF.max)}

                <path d={curveF} stroke={cF} strokeWidth={2.3} fill="none" />
                <path
                  d={tangentF(x)}
                  stroke={cTanX}
                  strokeWidth={2.8}
                  fill="none"
                  opacity={0.95}
                />
                <path
                  d={tangentF(xh)}
                  stroke={cTanXh}
                  strokeWidth={2.8}
                  fill="none"
                  opacity={0.95}
                />

                <line
                  x1={sx(x, W)}
                  y1={syF(fx)}
                  x2={sx(xh, W)}
                  y2={syF(fxh)}
                  stroke={cSec}
                  strokeWidth={2.2}
                  opacity={0.95}
                />

                <circle
                  cx={sx(x, W)}
                  cy={syF(fx)}
                  r={7}
                  fill={cX}
                  onMouseDown={() => (dragging.current = "x")}
                  style={{ cursor: "grab" }}
                />
                <circle
                  cx={sx(xh, W)}
                  cy={syF(fxh)}
                  r={7}
                  fill={cXh}
                  onMouseDown={() => (dragging.current = "xh")}
                  style={{ cursor: "grab" }}
                />

                {/* subtle glow */}
                <circle
                  cx={sx(x, W)}
                  cy={syF(fx)}
                  r={14}
                  fill={cX}
                  opacity={0.12}
                />
                <circle
                  cx={sx(xh, W)}
                  cy={syF(fxh)}
                  r={14}
                  fill={cXh}
                  opacity={0.1}
                />
              </svg>

              {/* minimalist toggles row (no explanations) */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 10,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ ...miniPill, cursor: "default" }}>f(x)</span>
                <span style={{ ...miniPill, cursor: "default" }}>
                  tangent@x
                </span>
                <span style={{ ...miniPill, cursor: "default" }}>
                  tangent@x+h
                </span>
                <span style={{ ...miniPill, cursor: "default" }}>secant</span>
              </div>
            </div>

            {/* graph 2: f'(x) */}
            <div
              style={{
                marginTop: 14,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(2,6,23,0.35)",
                padding: 12,
              }}
            >
              <svg
                width={W}
                height={H2}
                onPointerMove={onMoveD}
                onPointerUp={() => (dragging.current = null)}
                onPointerLeave={() => (dragging.current = null)}
                style={{ display: "block", touchAction: "none" }}
              >
                {gridLines(H2, syD, yRangeD.min, yRangeD.max)}

                <path d={curveD} stroke={cD} strokeWidth={2.3} fill="none" />
                <circle cx={sx(x, W)} cy={syD(dfx)} r={6} fill={cX} />
                <circle
                  cx={sx(xh, W)}
                  cy={syD(dfxh)}
                  r={6}
                  fill={cXh}
                  opacity={0.9}
                />

                {/* optional: you can drag points here too (same drag state) */}
                <circle
                  cx={sx(x, W)}
                  cy={syD(dfx)}
                  r={14}
                  fill={cX}
                  opacity={0.08}
                  onMouseDown={() => (dragging.current = "x")}
                  style={{ cursor: "grab" }}
                />
                <circle
                  cx={sx(xh, W)}
                  cy={syD(dfxh)}
                  r={14}
                  fill={cXh}
                  opacity={0.06}
                  onMouseDown={() => (dragging.current = "xh")}
                  style={{ cursor: "grab" }}
                />
              </svg>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 10,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ ...miniPill, cursor: "default" }}>f'(x)</span>
                <span style={{ ...miniPill, cursor: "default" }}>points</span>
              </div>
            </div>
          </div>
        </div>

        {/* bottom spacing */}
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
