import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'two-maps.ts'), 'utf8');
const relPath = 'src/happy-path/array/two-maps/two-maps.ts';

// `pipeline` maps TWO branching callbacks over TWO distinct array params: `(n) => …` over `xs` and
// `(m) => …` over `ys`. Each callback is anonymous, so its scope segment is the spelling-invariant
// STRUCTURAL projection of the arrow (node kinds + leaf values). Coverage IDs are cache-internal, so
// these exact strings are not load-bearing; what they pin is that each callback's exits attach UNDER
// pipeline's scope path, so the funnel threads `*module*/pipeline/<CB>/…` before pipeline's own return.
const CB_A =
  'fn:ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,Block,IfStatement,BinaryExpression,id:n,' +
  'GreaterThanToken,num:100,Block,ReturnStatement,BinaryExpression,id:n,AsteriskToken,num:2,' +
  'ReturnStatement,id:n';
const CB_B =
  'fn:ArrowFunction,Parameter,id:m,EqualsGreaterThanToken,Block,IfStatement,BinaryExpression,id:m,' +
  'LessThanToken,num:0,Block,ReturnStatement,num:0,ReturnStatement,id:m';
const CB_A_PATH = `*module*/pipeline/${CB_A}`;
const CB_B_PATH = `*module*/pipeline/${CB_B}`;
const GT100 = 'if:BinaryExpression,id:n,GreaterThanToken,num:100';
const LT0 = 'if:BinaryExpression,id:m,LessThanToken,num:0';

// Callback A's two arms (`n > 100` then / else), callback B's two arms (`m < 0` then / else), and
// pipeline's own single return.
const A_THEN = `${CB_A_PATH}/return@${GT100}#then`;
const A_ELSE = `${CB_A_PATH}/return@${GT100}#else`;
const B_THEN = `${CB_B_PATH}/return@${LT0}#then`;
const B_ELSE = `${CB_B_PATH}/return@${LT0}#else`;
const PIPELINE_EXIT = '*module*/pipeline/return@top';

// Each callback's branch and iteration. Whether a callback's body runs is an arm of pipeline: skipped over an
// empty array and run over any other.
const A_BRANCH = `${CB_A_PATH}/${GT100}`;
const B_BRANCH = `${CB_B_PATH}/${LT0}`;
const A_ITERATES = `${CB_A_PATH}/iterates`;
const B_ITERATES = `${CB_B_PATH}/iterates`;
const step = (branchCoverageId: string, arm: string): { branchCoverageId: string; arm: string } => ({ branchCoverageId, arm });

// The four shapes each array fans over (empty, the `then` element, the `else` element, the arm-crossing pair),
// with the exits a callback reaches and the arms it takes on each.
const A_SHAPES = [
  { value: [] as number[], path: [] as string[], arms: [step(A_ITERATES, 'skipped')] },
  { value: [101], path: [A_THEN], arms: [step(A_ITERATES, 'runs'), step(A_BRANCH, 'then')] },
  { value: [100], path: [A_ELSE], arms: [step(A_ITERATES, 'runs'), step(A_BRANCH, 'else')] },
  { value: [101, 100], path: [A_THEN, A_ELSE], arms: [step(A_ITERATES, 'runs'), step(A_BRANCH, 'then'), step(A_BRANCH, 'else')] },
];
const B_SHAPES = [
  { value: [] as number[], path: [] as string[], arms: [step(B_ITERATES, 'skipped')] },
  { value: [-1], path: [B_THEN], arms: [step(B_ITERATES, 'runs'), step(B_BRANCH, 'then')] },
  { value: [0], path: [B_ELSE], arms: [step(B_ITERATES, 'runs'), step(B_BRANCH, 'else')] },
  { value: [-1, 0], path: [B_THEN, B_ELSE], arms: [step(B_ITERATES, 'runs'), step(B_BRANCH, 'then'), step(B_BRANCH, 'else')] },
];

// The every-route set is the cartesian of the two (A outermost). The fewest runs are the first, where both
// callbacks are skipped, and the last, where both run on their arm-crossing pair: those two take all eight
// arms, and no single case does, so no smaller set exists.
const FEWEST_RUNS = new Set([0, 15]);
const EXPECTED_CASES = A_SHAPES.flatMap((a, aIndex) =>
  B_SHAPES.map((b, bIndex) => ({
    reachesPath: [...a.path, ...b.path, PIPELINE_EXIT],
    arrange: [
      { kind: 'array', param: 'xs', value: a.value },
      { kind: 'array', param: 'ys', value: b.value },
    ],
    arms: [...a.arms, ...b.arms],
    driven: true,
    fewestRuns: FEWEST_RUNS.has(aIndex * B_SHAPES.length + bIndex),
  })),
);

describe('array / two-maps — `pipeline` maps TWO branching callbacks over TWO array params, funnelled as the CARTESIAN of both', () => {
  // THE capability. Neither callback can be reached without calling `pipeline` — calling it runs both
  // `.map`s, which run each callback per element — so neither is a separate entry: BOTH funnel into
  // pipeline's OWN case set. Because the callbacks fire over INDEPENDENT arrays, the funnel is the
  // CARTESIAN of each callback's per-element funnel: each array param fans over its four shapes (empty,
  // the `then`-element, the `else`-element, and the arm-crossing pair), and every pairing is a distinct
  // input to pipeline — steering `xs` into one callback's arm while steering `ys` into another. That is
  // 4 × 4 = 16 cases, ordered by fire order (A over `xs` fires first, so it is the outer axis). Each
  // case's arrange sets BOTH array params (never a scalar fill — a sibling array param is a REAL array),
  // and its `reachesPath` threads A's callback exit(s), then B's, then pipeline's return. The empty×empty
  // case runs both callbacks zero times, so its path is pipeline's exit alone. Each value is an INPUT
  // (P4); the case asserts only the reached PATH. This is map-conditional's twin one array wider.
  it('VALID: {pipeline mapping two branching callbacks over xs and ys} => FUNNELLED as the 16-case cartesian of both callbacks', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'two-maps.ts') }) });

    expect(
      analysis.functions.map((fn) => ({ name: fn.entry.name, label: fn.entry.label, access: fn.entry.access, cases: fn.cases })),
    ).toStrictEqual([
      {
        name: 'pipeline',
        label: undefined,
        access: { kind: 'named' },
        cases: EXPECTED_CASES,
      },
    ]);
  });

  // Both callbacks are reached, so neither is dead code, and every combination of their arms drives
  // through pipeline's funnel. Nothing is admitted — the walk read every arm of both callbacks and the
  // cartesian drives them all through the one entry.
  it('VALID: {two reached, funnelled callbacks} => no dead-surface lint, nothing undriven or dark', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'two-maps.ts') }) });

    expect({
      lints: analysis.lints,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      declaredTypes: analysis.declaredTypes,
    }).toStrictEqual({ lints: [], undriven: [], darkSpots: [], declaredTypes: [] });
  });
});
