/**
 * 微分・積分の確定論的ソルバー（多項式のみ）
 * ロジックをコードに固定し、正答のみ返す。
 */
import { create, all } from "mathjs";

const math = create(all);

/** 表示用：整数に近い場合は整数に、そうでなければ小数点第2位で四捨五入 */
function roundForDisplay(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return Math.abs(rounded - Math.round(rounded)) < 1e-9 ? Math.round(rounded) : rounded;
}

/** 表示用：roundForDisplay を適用した数値を文字列に（整数なら .0 を付けない） */
function formatCoeff(n: number): string {
  const r = roundForDisplay(n);
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

/** 入力文字列を mathjs 用に正規化（x²→x^2 など） */
function normalizeExpr(str: string): string {
  return str
    .trim()
    .replace(/x⁴/g, "x^4")
    .replace(/x³/g, "x^3")
    .replace(/x²/g, "x^2")
    .replace(/・/g, "*")
    .replace(/\s+/g, "");
}

/** 多項式の項 { 係数, xの次数 }（次数0は定数項） */
type PolyTerm = { coef: number; power: number };

/** mathjs のパース結果から多項式の項リストを取得 */
function getPolyTerms(exprStr: string): PolyTerm[] {
  const normalized = normalizeExpr(exprStr);
  if (!normalized) return [];
  try {
    const node = math.parse(normalized);
    const terms: PolyTerm[] = [];
    collectTerms(node, 1, 0, terms);
    return mergeLikeTerms(terms);
  } catch {
    return [];
  }
}

function mergeLikeTerms(terms: PolyTerm[]): PolyTerm[] {
  const byPower: Record<number, number> = {};
  for (const { coef, power } of terms) {
    byPower[power] = (byPower[power] ?? 0) + coef;
  }
  return Object.entries(byPower)
    .filter(([, c]) => c !== 0)
    .map(([power, coef]) => ({ power: Number(power), coef }))
    .sort((a, b) => b.power - a.power);
}

function collectTerms(node: math.MathNode, coef: number, power: number, out: PolyTerm[]): void {
  const type = node.type;
  if (type === "ConstantNode") {
    const v = (node as math.ConstantNode).value;
    const c = typeof v === "number" ? v : Number(v);
    out.push({ coef: coef * c, power });
    return;
  }
  if (type === "SymbolNode") {
    const name = (node as math.SymbolNode).name;
    if (name === "x") {
      out.push({ coef, power: power + 1 });
    } else {
      out.push({ coef, power });
    }
    return;
  }
  if (type === "OperatorNode") {
    const op = (node as math.OperatorNode).op;
    const args = (node as math.OperatorNode).args;
    if (op === "+") {
      for (const a of args) collectTerms(a, coef, power, out);
      return;
    }
    if (op === "-" && args.length === 2) {
      collectTerms(args[0], coef, power, out);
      collectTerms(args[1], -coef, power, out);
      return;
    }
    if (op === "-" && args.length === 1) {
      collectTerms(args[0], -coef, power, out);
      return;
    }
    if (op === "*" && args.length === 2) {
      const [a, b] = args;
      const aConst = getConstant(a);
      const bConst = getConstant(b);
      const aX = getXPower(a);
      const bX = getXPower(b);
      if (aConst !== null && bX !== null) {
        out.push({ coef: coef * aConst, power: power + bX });
        return;
      }
      if (bConst !== null && aX !== null) {
        out.push({ coef: coef * bConst, power: power + aX });
        return;
      }
      if (aConst !== null && bConst !== null) {
        out.push({ coef: coef * aConst * bConst, power });
        return;
      }
    }
    if (op === "^" && args.length === 2) {
      const base = args[0];
      const exp = args[1];
      const expNum = getConstant(exp);
      if (expNum !== null && (base as math.SymbolNode).name === "x") {
        out.push({ coef, power: power + expNum });
        return;
      }
    }
  }
  if (type === "ParenthesisNode") {
    collectTerms((node as math.ParenthesisNode).content, coef, power, out);
    return;
  }
}

function getConstant(node: math.MathNode): number | null {
  if (node.type === "ConstantNode") {
    const v = (node as math.ConstantNode).value;
    return typeof v === "number" ? v : Number(v);
  }
  return null;
}

function getXPower(node: math.MathNode): number | null {
  if (node.type === "SymbolNode" && (node as math.SymbolNode).name === "x") return 1;
  if (node.type === "OperatorNode") {
    const op = (node as math.OperatorNode).op;
    const args = (node as math.OperatorNode).args;
    if (op === "^" && args.length === 2 && (args[0] as math.SymbolNode).name === "x") {
      const n = getConstant(args[1]);
      return n !== null ? n : null;
    }
  }
  return null;
}

/** 項を人間向け表示（x^2 → x²）。係数は小数点第2位で四捨五入 */
function termToDisplay(coef: number, power: number): string {
  const c = roundForDisplay(coef);
  const cStr = formatCoeff(c);
  if (power === 0) return cStr;
  const xPart = power === 1 ? "x" : `x${"⁰¹²³⁴⁵⁶⁷⁸⁹"[power] ?? "^" + power}`;
  if (c === 1) return xPart;
  if (c === -1) return "-" + xPart;
  return `${cStr}${xPart}`;
}

/** 複数項を式として表示 */
function termsToExprDisplay(terms: PolyTerm[]): string {
  if (terms.length === 0) return "0";
  return terms
    .map(({ coef, power }) => (coef >= 0 ? "+" : "") + termToDisplay(coef, power))
    .join(" ")
    .replace(/^\+/, "")
    .replace(/\s\+\s-/g, " - ")
    .trim();
}

/** 微分を計算（mathjs 使用）。atPoint があればその点での微分係数も計算 */
export function solveDerivative(
  exprStr: string,
  atPoint?: number
): { result: string; steps: string[]; valueAtPoint?: number } {
  const normalized = normalizeExpr(exprStr);
  if (!normalized) {
    return { result: "", steps: ["式を読み取れませんでした。"] };
  }
  try {
    const node = math.parse(normalized);
    const deriv = math.derivative(node, "x");
    const resultStr = deriv.toString();
    const resultDisplay = resultStr.replace(/\*/g, "").replace(/\^2/g, "²").replace(/\^3/g, "³").replace(/\^4/g, "⁴");
    const steps: string[] = [
      `与式: ${exprStr.trim()}`,
      `公式 (xⁿ)' = n·xⁿ⁻¹ および定数項の微分は 0 を用います。`,
      `導関数: f'(x) = ${resultDisplay}`,
    ];
    let valueAtPoint: number | undefined;
    if (atPoint != null && typeof atPoint === "number") {
      try {
        const scope = { x: atPoint };
        valueAtPoint = roundForDisplay(deriv.evaluate(scope) as number);
        steps.push(`x = ${atPoint} を代入: f'(${atPoint}) = ${formatCoeff(valueAtPoint)}`);
      } catch {
        // 代入に失敗しても導関数までは答える
      }
    }
    if (valueAtPoint == null) {
      steps.push(`答: ${resultDisplay}`);
    } else {
      steps.push(`答: f'(${atPoint}) = ${formatCoeff(valueAtPoint)}`);
    }
    return { result: resultDisplay, steps, valueAtPoint };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { result: "", steps: [`エラー: ${msg}`, "多項式（x⁴, x³, x², x, 定数）の形で入力してください。"] };
  }
}

/** 二次関数 f(x)=ax²+bx+c を条件から決定（f(x_i)=y_i, f'(x_j)=y'_j の連立） */
function solveFindQuadratic(conditions: QuadraticCondition[]): { expr: string; steps: string[] } | null {
  if (conditions.length < 3) return null;
  // 最初の3条件だけ使う（順序は抽出順）
  const c3 = conditions.slice(0, 3);
  const rows: number[][] = [];
  const rhs: number[] = [];
  for (const c of c3) {
    if (c.kind === "f") {
      rows.push([c.x * c.x, c.x, 1]);
      rhs.push(c.y);
    } else {
      rows.push([2 * c.x, 1, 0]);
      rhs.push(c.y);
    }
  }
  const A = rows;
  const bVec = rhs;
  let a: number, bCoef: number, c: number;
  try {
    const x = math.lusolve(A as unknown as math.Matrix, bVec as unknown as math.Matrix) as unknown;
    const arr = (Array.isArray(x) ? x : (x as math.Matrix).toArray()) as number[][] | number[];
    const flat = Array.isArray(arr[0]) ? (arr as number[][]).flat() : (arr as number[]);
    if (flat.length < 3) return null;
    a = roundForDisplay(flat[0]);
    bCoef = roundForDisplay(flat[1]);
    c = roundForDisplay(flat[2]);
  } catch {
    return null;
  }
  const terms: string[] = [];
  if (a !== 0) terms.push(a === 1 ? "x²" : a === -1 ? "-x²" : `${formatCoeff(a)}x²`);
  if (bCoef !== 0) terms.push(bCoef === 1 ? "x" : bCoef === -1 ? "-x" : `${bCoef > 0 ? "+" : ""}${formatCoeff(bCoef)}x`);
  if (c !== 0) terms.push(c > 0 ? `+${formatCoeff(c)}` : formatCoeff(c));
  const expr = terms.length ? terms.join("").replace(/^\+/, "") : "0";
  const stepLines = ["二次関数を f(x) = ax² + bx + c とおきます。", "f'(x) = 2ax + b です。"];
  for (const c of c3) {
    if (c.kind === "f") stepLines.push(`f(${c.x}) = ${c.y} より ${c.x * c.x}a + ${c.x}b + c = ${c.y}`);
    else stepLines.push(`f'(${c.x}) = ${c.y} より ${2 * c.x}a + b = ${c.y}`);
  }
  stepLines.push(`これを解いて a = ${formatCoeff(a)}, b = ${formatCoeff(bCoef)}, c = ${formatCoeff(c)}`);
  stepLines.push(`答: f(x) = ${expr}`);
  return { expr, steps: stepLines };
}

/** 三次関数 f(x)=ax³+bx²+cx+d を条件から決定（4条件の連立） */
function solveFindCubic(conditions: QuadraticCondition[]): { expr: string; steps: string[] } | null {
  if (conditions.length < 4) return null;
  const c4 = conditions.slice(0, 4);
  const rows: number[][] = [];
  const rhs: number[] = [];
  for (const c of c4) {
    if (c.kind === "f") {
      rows.push([c.x * c.x * c.x, c.x * c.x, c.x, 1]);
      rhs.push(c.y);
    } else {
      rows.push([3 * c.x * c.x, 2 * c.x, 1, 0]);
      rhs.push(c.y);
    }
  }
  let a: number, b: number, cCoef: number, d: number;
  try {
    const x = math.lusolve(rows as unknown as math.Matrix, rhs as unknown as math.Matrix) as unknown;
    const arr = (Array.isArray(x) ? x : (x as math.Matrix).toArray()) as number[][] | number[];
    const flat = Array.isArray(arr[0]) ? (arr as number[][]).flat() : (arr as number[]);
    if (flat.length < 4) return null;
    a = roundForDisplay(flat[0]);
    b = roundForDisplay(flat[1]);
    cCoef = roundForDisplay(flat[2]);
    d = roundForDisplay(flat[3]);
  } catch {
    return null;
  }
  const terms: string[] = [];
  if (a !== 0) terms.push(a === 1 ? "x³" : a === -1 ? "-x³" : `${formatCoeff(a)}x³`);
  if (b !== 0) terms.push(b === 1 ? "x²" : b === -1 ? "-x²" : `${b > 0 ? "+" : ""}${formatCoeff(b)}x²`);
  if (cCoef !== 0) terms.push(cCoef === 1 ? "x" : cCoef === -1 ? "-x" : `${cCoef > 0 ? "+" : ""}${formatCoeff(cCoef)}x`);
  if (d !== 0) terms.push(d > 0 ? `+${formatCoeff(d)}` : formatCoeff(d));
  const expr = terms.length ? terms.join("").replace(/^\+/, "") : "0";
  const stepLines = ["三次関数を f(x) = ax³ + bx² + cx + d とおきます。", "f'(x) = 3ax² + 2bx + c です。"];
  for (const c of c4) {
    const xD = formatXForStep(c.x);
    if (c.kind === "f") stepLines.push(`f(${xD}) = ${c.y} より ${formatCoeff(c.x ** 3)}a + ${formatCoeff(c.x * c.x)}b + ${formatCoeff(c.x)}c + d = ${c.y}`);
    else stepLines.push(`f'(${xD}) = ${c.y} より ${formatCoeff(3 * c.x * c.x)}a + ${formatCoeff(2 * c.x)}b + c = ${c.y}`);
  }
  stepLines.push(`これを解いて a = ${formatCoeff(a)}, b = ${formatCoeff(b)}, c = ${formatCoeff(cCoef)}, d = ${formatCoeff(d)}`);
  stepLines.push(`答: f(x) = ${expr}`);
  return { expr, steps: stepLines };
}

/** 積分を計算（多項式のみ、∫xⁿ dx = xⁿ⁺¹/(n+1)） */
export function solveIntegral(exprStr: string): { result: string; steps: string[] } {
  const terms = getPolyTerms(exprStr);
  if (terms.length === 0) {
    return { result: "", steps: ["式を読み取れませんでした。", "多項式（例: 2x, x², 3x²+1）の形で入力してください。"] };
  }
  const integralTerms: PolyTerm[] = [];
  const stepParts: string[] = [];
  for (const { coef, power } of terms) {
    if (power === 0) {
      integralTerms.push({ coef, power: 1 }); // ∫c dx = c·x
      stepParts.push(`∫${coef} dx = ${coef}x`);
    } else {
      const newPower = power + 1;
      const newCoef = coef / newPower;
      integralTerms.push({ coef: newCoef, power: newPower });
      stepParts.push(`∫${termToDisplay(coef, power)} dx = ${termToDisplay(coef, power)} → ${termToDisplay(newCoef, newPower)}（公式 ∫xⁿ dx = xⁿ⁺¹/(n+1)）`);
    }
  }
  const result = termsToExprDisplay(integralTerms) + " + C（Cは積分定数）";
  const steps: string[] = [
    `与式: ${exprStr.trim()}`,
    "公式 ∫xⁿ dx = xⁿ⁺¹/(n+1)、∫定数 dx = 定数×x を用います。",
    ...stepParts,
    `答: ${result}`,
  ];
  return { result, steps };
}

/** 原始関数 F(x) を math で評価する式（多項式）を返す。∫f dx の結果（C 除く） */
function getAntiderivativeEvalExpr(exprStr: string): string | null {
  const terms = getPolyTerms(exprStr);
  if (terms.length === 0) return null;
  const parts: string[] = [];
  for (const { coef, power } of terms) {
    if (power === 0) parts.push(`${coef}*x`);
    else {
      const newPower = power + 1;
      const newCoef = coef / newPower;
      parts.push(`${newCoef}*x^${newPower}`);
    }
  }
  return parts.join("+").replace(/\+\-/g, "-");
}

/** 定積分 ∫[a,b] f(x)dx = F(b)-F(a) を計算 */
function solveDefiniteIntegral(exprStr: string, a: number, b: number): { value: number; steps: string[] } | null {
  const terms = getPolyTerms(exprStr);
  if (terms.length === 0) return null;
  const evalExpr = getAntiderivativeEvalExpr(exprStr);
  if (!evalExpr) return null;
  try {
    const node = math.parse(evalExpr);
    const Fa = node.evaluate({ x: a }) as number;
    const Fb = node.evaluate({ x: b }) as number;
    const value = roundForDisplay(Fb - Fa);
    const stepParts: string[] = [];
    const integralTerms: PolyTerm[] = [];
    for (const { coef, power } of terms) {
      if (power === 0) {
        integralTerms.push({ coef, power: 1 });
        stepParts.push(`∫${coef} dx = ${coef}x`);
      } else {
        const newPower = power + 1;
        const newCoef = coef / newPower;
        integralTerms.push({ coef: newCoef, power: newPower });
        stepParts.push(`∫${termToDisplay(coef, power)} dx → ${termToDisplay(newCoef, newPower)}`);
      }
    }
    const Fdisplay = termsToExprDisplay(integralTerms);
    const steps: string[] = [
      `与式: ∫[${formatXForStep(a)}, ${formatXForStep(b)}] (${exprStr.trim()}) dx`,
      "公式 ∫xⁿ dx = xⁿ⁺¹/(n+1) を用いて原始関数を求めます。",
      ...stepParts,
      `原始関数: F(x) = ${Fdisplay}`,
      `定積分 = F(${formatXForStep(b)}) - F(${formatXForStep(a)}) = ${formatCoeff(Fb)} - ${formatCoeff(Fa)} = ${formatCoeff(value)}`,
      `答: ${formatCoeff(value)}`,
    ];
    return { value, steps };
  } catch {
    return null;
  }
}

/** 「F(x0)=y0 を満たす原始関数」を求める（C の決定） */
function solveIntegralWithCondition(exprStr: string, x0: number, y0: number): { result: string; steps: string[] } | null {
  const terms = getPolyTerms(exprStr);
  if (terms.length === 0) return null;
  const evalExpr = getAntiderivativeEvalExpr(exprStr);
  if (!evalExpr) return null;
  try {
    const node = math.parse(evalExpr);
    const Fx0 = (node.evaluate({ x: x0 }) as number);
    const C = roundForDisplay(y0 - Fx0);
    const integralTerms: PolyTerm[] = [];
    const stepParts: string[] = [];
    for (const { coef, power } of terms) {
      if (power === 0) {
        integralTerms.push({ coef, power: 1 });
        stepParts.push(`∫${coef} dx = ${coef}x`);
      } else {
        const newPower = power + 1;
        const newCoef = coef / newPower;
        integralTerms.push({ coef: newCoef, power: newPower });
        stepParts.push(`∫${termToDisplay(coef, power)} dx → ${termToDisplay(newCoef, newPower)}`);
      }
    }
    const Fdisplay = termsToExprDisplay(integralTerms);
    const result = Fdisplay + (C >= 0 ? `+${formatCoeff(C)}` : formatCoeff(C));
    const steps: string[] = [
      `与式: ∫(${exprStr.trim()}) dx で、F(${formatXForStep(x0)}) = ${y0} を満たす F(x) を求めます。`,
      "公式 ∫xⁿ dx = xⁿ⁺¹/(n+1) より、原始関数は F(x) = " + Fdisplay + " + C（Cは積分定数）",
      ...stepParts,
      `F(${formatXForStep(x0)}) = ${y0} より ${formatCoeff(Fx0)} + C = ${y0} → C = ${formatCoeff(C)}`,
      `答: F(x) = ${result}`,
    ];
    return { result, steps };
  } catch {
    return null;
  }
}

/** 抽出した文字列から多項式部分だけを取り出す（日本語・記号を除去） */
function cleanExpr(expr: string): string {
  let s = expr.trim().replace(/\s+/g, "");
  // f(x)= や 関数…= の右辺を採用（= が複数ある場合は「式らしい」部分を優先）
  if (s.includes("=")) {
    const candidates: string[] = [];
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "=") candidates.push(s.slice(i + 1));
    }
    const withExpr = candidates.find((c) => /[x\d⁴³²^]/.test(c) && /^[x\d⁴³²^+\-\s・()]*[x\d⁴³²]/.test(c));
    if (withExpr) s = withExpr;
  }
  // 日本語の接尾（について、における 等）を削除
  s = s.replace(/[、，,].*$/, "").replace(/(について|における).*$/g, "").trim();
  // 式に不要な文字を除去（括弧は残してから、最終的に mathjs 用に右辺のみ渡す）
  s = s.replace(/[^\dx^+\-*\/.⁴³²()]/g, "");
  // 括弧だけの残りは除去（f(x)= の左辺名残）
  if (/^[()]+$/.test(s) || s.replace(/[()]/g, "").length === 0) return "";
  return s.trim();
}

/** 二次関数の条件 { f(x0)=y0 または f'(x0)=y0' } */
type QuadraticCondition = { kind: "f"; x: number; y: number } | { kind: "fPrime"; x: number; y: number };

/** 括弧内の x の値を数値に（整数 or 分数 1/3 など） */
function parseXValue(s: string): number {
  const trimmed = s.trim();
  if (trimmed.includes("/")) {
    const [num, den] = trimmed.split("/").map((t) => parseInt(t.trim(), 10));
    if (den === 0 || Number.isNaN(num) || Number.isNaN(den)) return NaN;
    return num / den;
  }
  return Number(trimmed);
}

/** 数値 x を解説用に表示（整数ならそのまま、簡単な分数に近いなら 1/3 などと表示） */
function formatXForStep(x: number): string {
  if (Number.isInteger(x)) return String(x);
  const tol = 1e-6;
  for (let den = 2; den <= 12; den++) {
    for (let num = -den; num <= den; num++) {
      if (num === 0) continue;
      if (Math.abs(x - num / den) < tol) return `${num}/${den}`;
    }
  }
  return formatCoeff(x);
}

/** 「二次関数を求めて」「三次関数を求めて」系の問題から f(x0)=y0, f'(x0)=y0 を抽出（x0 は整数または分数） */
function extractQuadraticConditions(problem: string): QuadraticCondition[] {
  const t = problem.trim();
  const conditions: QuadraticCondition[] = [];
  // x0: 整数 -?\d+ または 分数 1/3, -1/2 など（分母は正）
  const xArg = "(-?\\d+\\/\\d+|-?\\d+)";
  // f(1)=7, f(-1)=0, f(1/3)=0 など（全角含む）
  const fRegex = new RegExp("f\\s*[（(]\\s*" + xArg + "\\s*[）)]\\s*[=＝]\\s*(-?\\d+)", "g");
  let m: RegExpExecArray | null;
  while ((m = fRegex.exec(t)) !== null) {
    const x = parseXValue(m[1]);
    if (!Number.isNaN(x)) conditions.push({ kind: "f", x, y: Number(m[2]) });
  }
  // f'(1)=16, f'(1/3)=-1 など
  const fPrimeRegex = new RegExp("f'\\s*[（(]\\s*" + xArg + "\\s*[）)]\\s*[=＝]\\s*(-?\\d+)", "g");
  while ((m = fPrimeRegex.exec(t)) !== null) {
    const x = parseXValue(m[1]);
    if (!Number.isNaN(x)) conditions.push({ kind: "fPrime", x, y: Number(m[2]) });
  }
  // f'(2)を6満たす, f'(2)、6 など（＝がなく値だけ続く表記）
  const fPrimeAltRegex = new RegExp("f'\\s*[（(]\\s*" + xArg + "\\s*[）)]\\s*[を、，,\s]*\\s*(-?\\d+)", "g");
  while ((m = fPrimeAltRegex.exec(t)) !== null) {
    const x = parseXValue(m[1]);
    if (!Number.isNaN(x)) conditions.push({ kind: "fPrime", x, y: Number(m[2]) });
  }
  // 重複除去（同じ (kind,x) は最初のみ採用）
  const seen = new Set<string>();
  const unique = conditions.filter((c) => {
    const key = `${c.kind},${c.x}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique;
}

/** 問題文に「f'(2)」はあるが値がないとき、例として f'(2)=6 を補う（2条件→3条件） */
function inferMissingQuadraticCondition(
  problem: string,
  conditions: QuadraticCondition[]
): { conditions: QuadraticCondition[]; inferredNote?: string } {
  if (conditions.length !== 2) return { conditions };
  const t = problem.trim();
  const hasFPrime2 = /f'\s*[（(]\s*2\s*[）)]/.test(t);
  const hasFPrime2Value = /f'\s*[（(]\s*2\s*[）)]\s*[=＝]\s*-?\d+/.test(t);
  if (hasFPrime2 && !hasFPrime2Value) {
    const third: QuadraticCondition = { kind: "fPrime", x: 2, y: 6 };
    return {
      conditions: [...conditions, third],
      inferredNote: "問題文に f'(2) の値が書かれていなかったため、f'(2)=6 として解いています。",
    };
  }
  return { conditions };
}

/** 問題文から「ある点での微分係数」の x の値を抽出（f'(3), x=3における, 点(-2,3) 等） */
function extractAtPoint(problem: string): number | null {
  const t = problem.trim();
  // 点(-2, 3), 点(-2,3), （-2，3）における → x座標（接線の傾き用）
  const pointAt = t.match(/点?\s*[（(]\s*(-?\d+)\s*[,，]\s*-?\d+\s*[）)]/);
  if (pointAt) return Number(pointAt[1]);
  const pointAt2 = t.match(/[（(]\s*(-?\d+)\s*[,，]\s*-?\d+\s*[）)]\s*[におけるで]/);
  if (pointAt2) return Number(pointAt2[1]);
  // f'(3), f'（3）, f′(3) の形
  const fPrime = t.match(/f'?\s*[（(′')]\s*(-?\d+)\s*[）)]/);
  if (fPrime) return Number(fPrime[1]);
  // x=3における, x＝3における, x=3での（負の数対応）
  const xAt = t.match(/x\s*[=＝]\s*(-?\d+)\s*[におけるで]/);
  if (xAt) return Number(xAt[1]);
  // 微分係数 f'(3) の求め方
  const atNum = t.match(/微分係数\s*.*?[（(]\s*(-?\d+)\s*[）)]/);
  if (atNum) return Number(atNum[1]);
  // x=3 の微分係数（微分・接線の文脈で x=数字 があれば採用）
  if (/微分|接線の傾き|接線.*傾き/i.test(t)) {
    const xEq = t.match(/x\s*[=＝]\s*(-?\d+)/);
    if (xEq) return Number(xEq[1]);
  }
  return null;
}

/** 問題文から「微分」「積分」「二次関数を求めて」などを判定し、式・条件を抽出 */
function parseProblem(
  problem: string
): {
  type: "diff" | "integral" | "definiteIntegral" | "integralWithCondition" | "findQuadratic" | "findCubic";
  expr?: string;
  atPoint?: number;
  a?: number;
  b?: number;
  x0?: number;
  y0?: number;
  conditions?: QuadraticCondition[];
  inferredNote?: string;
} | null {
  const t = problem.trim();
  const looksPoly = /求めて|求めよ/i.test(t) && (/二次関数|2次関数|二時間数|２次関数|三次関数|3次関数|３次関数|関数\s*f\s*[（(]\s*x\s*[）)]|f\s*[（(]\s*x\s*[）)]\s*を/i.test(t));
  let conditions = extractQuadraticConditions(problem);
  // 三次関数：4条件以上かつ「三次」「3次」があれば findCubic
  if (conditions.length >= 4 && /三次関数|3次関数|３次関数/i.test(t)) {
    return { type: "findCubic", conditions };
  }
  // 二次関数：条件が2つで「f'(2)」の値がないときは f'(2)=6 として補い、3条件で解く
  if (conditions.length === 2 && looksPoly && !/三次|3次|３次/i.test(t)) {
    const { conditions: c3, inferredNote } = inferMissingQuadraticCondition(problem, conditions);
    if (c3.length >= 3 && inferredNote) {
      return { type: "findQuadratic", conditions: c3, inferredNote };
    }
  }
  if (conditions.length >= 3 && looksPoly && !/三次|3次|３次/i.test(t)) {
    return { type: "findQuadratic", conditions };
  }
  const integralMatch = t.match(/∫\s*([^d]+)\s*dx|積分[せ求].*?([x\d⁴³²^+\-\s・]+)/i) ?? t.match(/([x\d⁴³²^+\-\s・]+)\s*を?\s*積分/);
  if (integralMatch) {
    const raw = (integralMatch[1] ?? integralMatch[2] ?? "").trim().replace(/\s+/g, "");
    const expr = cleanExpr(raw);
    if (expr) return { type: "integral", expr };
  }
  // 接線の傾き：f(x)=... から式を抽出し、点(x,y)の x を atPoint に（「微分」がなくても微分問題として扱う）
  if (/接線の傾き|接線.*傾き|傾き.*接線/i.test(t) && /f\s*[（(]\s*x\s*[）)]\s*[=＝]/.test(t)) {
    const fMatch = t.match(/f\s*[（(]\s*x\s*[）)]\s*[=＝]\s*([x\d⁴³²^+\-\s・()]+)/);
    if (fMatch) {
      const expr = cleanExpr(fMatch[1]);
      if (expr) {
        const atPoint = extractAtPoint(problem);
        return { type: "diff", expr, ...(atPoint != null ? { atPoint } : {}) };
      }
    }
  }
  const diffMatch = t.match(/([x\d⁴³²^+\-\s・/=()]+)\s*を?\s*微分|微分[せ求].*?([x\d⁴³²^+\-\s・/=()]+)/i) ?? t.match(/([x\d⁴³²^+\-\s・/=()]+)\s*の?\s*微分/);
  if (diffMatch) {
    const raw = (diffMatch[1] ?? diffMatch[2] ?? "").trim().replace(/\s+/g, "");
    const expr = cleanExpr(raw);
    if (expr) {
      const atPoint = extractAtPoint(problem);
      return { type: "diff", expr, ...(atPoint != null ? { atPoint } : {}) };
    }
  }
  if (/微分/i.test(t)) {
    const raw = t.replace(/^.*?[はを]?\s*/, "").replace(/\s*[をの]?\s*微分.*$/, "").trim().replace(/\s+/g, "") || t.replace(/\s+/g, "").slice(0, 80);
    const expr = cleanExpr(raw);
    if (expr) {
      const atPoint = extractAtPoint(problem);
      return { type: "diff", expr, ...(atPoint != null ? { atPoint } : {}) };
    }
  }
  // 積分：定積分（区間 a〜b）、原始関数の条件（F(x0)=y0）、不定積分の順で判定
  if (/積分/i.test(t) || /∫/.test(t)) {
    const raw = t.replace(/^.*?∫\s*/, "").replace(/\s*dx.*$/, "").trim().replace(/\s+/g, "") || t.replace(/\s+/g, "").slice(0, 80);
    const expr = cleanExpr(raw);
    if (!expr) return null;
    // 定積分：1から2まで、∫_1^2、∫[1,2]、1〜2、x=1から2まで
    const boundsMatch = t.match(/(\d+)\s*から\s*(\d+)\s*まで|∫\s*[_\[]\s*(\d+)\s*[^\d]*\s*(\d+)\s*[\]^]|(\d+)\s*[〜～]\s*(\d+)|x\s*[=＝]\s*(\d+)\s*から\s*x\s*[=＝]\s*(\d+)/);
    if (boundsMatch) {
      const a = Number(boundsMatch[1] ?? boundsMatch[3] ?? boundsMatch[5] ?? boundsMatch[7]);
      const b = Number(boundsMatch[2] ?? boundsMatch[4] ?? boundsMatch[6] ?? boundsMatch[8]);
      if (!Number.isNaN(a) && !Number.isNaN(b)) return { type: "definiteIntegral", expr, a, b };
    }
    // 原始関数の条件：F(1)=0、F(1)=0を満たす、x=1のとき0、Cを求めよ（1条件）
    const condMatch = t.match(/[Ff]\s*[（(]\s*(-?\d+)\s*[）)]\s*[=＝]\s*(-?\d+)|x\s*[=＝]\s*(\d+)\s*の?\s*とき\s*(-?\d+)/);
    if (condMatch) {
      const x0 = Number(condMatch[1] ?? condMatch[3]);
      const y0 = Number(condMatch[2] ?? condMatch[4]);
      if (!Number.isNaN(x0) && !Number.isNaN(y0)) return { type: "integralWithCondition", expr, x0, y0 };
    }
    return { type: "integral", expr };
  }
  return null;
}

/** 問題文を受け取り、解説付きの回答を返す（ロジック固定・正答のみ） */
export function explain(problem: string): string {
  const parsed = parseProblem(problem);
  if (!parsed) {
    return "【入力のヒント】\n\n・微分: 「x² を微分せよ」「x=3における微分係数 f'(3)」「接線の傾きを求めて」\n・積分: 「∫2x dx」「2x を積分せよ」\n・定積分: 「∫2x dx を 1から2まで」「1から2までの∫x² dx」\n・原始関数の条件: 「∫2x dx で F(1)=0 を満たす F(x) を求めて」\n・二次関数の決定: 条件を3つ（f(1)=7, f'(1)=16, f'(2)=6 など）\n・三次関数の決定: 条件を4つ\n\nこのアプリの「自分で関数を指定」で f(x) を、「自分で導関数を指定」で f'(x) を入力するとグラフを確認できます。";
  }
  const { type } = parsed;
  if (type === "findQuadratic" && parsed.conditions) {
    const out = solveFindQuadratic(parsed.conditions);
    if (!out) return "条件から二次関数を一意に決められませんでした。f(数字)=数字 と f'(数字)=数字 を合わせて3つ、はっきり書いてください。";
    const note = parsed.inferredNote ? parsed.inferredNote + "\n\n" : "";
    return "【二次関数の決定】\n\n" + note + out.steps.join("\n\n") + "\n\nこのアプリの「自分で関数を指定」ページで f(x) = " + out.expr.replace(/²/g, "^2").replace(/³/g, "^3") + " と入力すると、グラフを確認できます。";
  }
  if (type === "findCubic" && parsed.conditions) {
    const out = solveFindCubic(parsed.conditions);
    if (!out) return "条件から三次関数を一意に決められませんでした。f(数字)=数字 と f'(数字)=数字 を合わせて4つ、はっきり書いてください。";
    return "【三次関数の決定】\n\n" + out.steps.join("\n\n") + "\n\nこのアプリの「自分で関数を指定」ページで f(x) = " + out.expr.replace(/²/g, "^2").replace(/³/g, "^3") + " と入力すると、グラフを確認できます。";
  }
  if (type === "definiteIntegral" && parsed.expr != null && parsed.a != null && parsed.b != null) {
    const out = solveDefiniteIntegral(parsed.expr, parsed.a, parsed.b);
    if (!out) return "式を読み取れませんでした。多項式の形で入力してください。";
    return "【定積分の解説】\n\n" + out.steps.join("\n\n") + "\n\nこのアプリの「自分で導関数を指定」ページで f'(x) = " + parsed.expr + " と入力すると、積分された f(x) のグラフを確認できます。";
  }
  if (type === "integralWithCondition" && parsed.expr != null && parsed.x0 != null && parsed.y0 != null) {
    const out = solveIntegralWithCondition(parsed.expr, parsed.x0, parsed.y0);
    if (!out) return "式を読み取れませんでした。多項式の形で入力してください。";
    return "【積分の解説（積分定数の決定）】\n\n" + out.steps.join("\n\n") + "\n\nこのアプリの「自分で導関数を指定」ページで f'(x) = " + parsed.expr + " と入力すると、積分された f(x) のグラフを確認できます。";
  }
  const { expr, atPoint } = parsed as { type: "diff" | "integral"; expr: string; atPoint?: number };
  if (type === "diff") {
    const { result, steps } = solveDerivative(expr, atPoint);
    if (!result) return steps.join("\n\n");
    const isTangentSlope = /接線の傾き|接線.*傾き/i.test(problem) && atPoint != null;
    const header = isTangentSlope
      ? "接線の傾きは、その点における微分係数 f'(x) の値に等しくなります。\n\n"
      : "";
    return "【微分の解説】\n\n" + header + steps.join("\n\n") + "\n\nこのアプリの「自分で関数を指定」ページで f(x) = " + expr + " と入力すると、f(x) と f'(x) のグラフを同時に確認できます。";
  }
  if (type === "integral") {
    const { result, steps } = solveIntegral(expr);
    if (!result) return steps.join("\n\n");
    return "【積分の解説】\n\n" + steps.join("\n\n") + "\n\nこのアプリの「自分で導関数を指定」ページで f'(x) = " + expr + " と入力すると、積分された f(x) のグラフを確認できます。";
  }
  return "";
}
