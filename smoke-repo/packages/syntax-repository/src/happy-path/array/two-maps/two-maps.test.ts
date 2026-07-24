import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

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
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(
      analysis.functions.map((fn) => ({ name: fn.entry.name, label: fn.entry.label, access: fn.entry.access, cases: fn.cases })),
    ).toStrictEqual([
      {
        name: 'pipeline',
        label: undefined,
        access: { kind: 'named' },
        cases: [
          // A empty × B {empty, then, else, pair}
          { reachesPath: [PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [] }, { kind: 'array', param: 'ys', value: [] }], salient: true },
          { reachesPath: [B_THEN, PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [] }, { kind: 'array', param: 'ys', value: [-1] }], salient: true },
          { reachesPath: [B_ELSE, PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [] }, { kind: 'array', param: 'ys', value: [0] }], salient: true },
          { reachesPath: [B_THEN, B_ELSE, PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [] }, { kind: 'array', param: 'ys', value: [-1, 0] }], salient: true },
          // A then (101) × B {empty, then, else, pair}
          { reachesPath: [A_THEN, PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [101] }, { kind: 'array', param: 'ys', value: [] }], salient: true },
          { reachesPath: [A_THEN, B_THEN, PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [101] }, { kind: 'array', param: 'ys', value: [-1] }], salient: true },
          { reachesPath: [A_THEN, B_ELSE, PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [101] }, { kind: 'array', param: 'ys', value: [0] }], salient: true },
          { reachesPath: [A_THEN, B_THEN, B_ELSE, PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [101] }, { kind: 'array', param: 'ys', value: [-1, 0] }], salient: true },
          // A else (100) × B {empty, then, else, pair}
          { reachesPath: [A_ELSE, PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [100] }, { kind: 'array', param: 'ys', value: [] }], salient: true },
          { reachesPath: [A_ELSE, B_THEN, PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [100] }, { kind: 'array', param: 'ys', value: [-1] }], salient: true },
          { reachesPath: [A_ELSE, B_ELSE, PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [100] }, { kind: 'array', param: 'ys', value: [0] }], salient: true },
          { reachesPath: [A_ELSE, B_THEN, B_ELSE, PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [100] }, { kind: 'array', param: 'ys', value: [-1, 0] }], salient: true },
          // A pair (101, 100) × B {empty, then, else, pair}
          { reachesPath: [A_THEN, A_ELSE, PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [101, 100] }, { kind: 'array', param: 'ys', value: [] }], salient: true },
          { reachesPath: [A_THEN, A_ELSE, B_THEN, PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [101, 100] }, { kind: 'array', param: 'ys', value: [-1] }], salient: true },
          { reachesPath: [A_THEN, A_ELSE, B_ELSE, PIPELINE_EXIT], arrange: [{ kind: 'array', param: 'xs', value: [101, 100] }, { kind: 'array', param: 'ys', value: [0] }], salient: true },
          {
            reachesPath: [A_THEN, A_ELSE, B_THEN, B_ELSE, PIPELINE_EXIT],
            arrange: [{ kind: 'array', param: 'xs', value: [101, 100] }, { kind: 'array', param: 'ys', value: [-1, 0] }],
            salient: true,
          },
        ],
      },
    ]);
  });

  // Both callbacks are reached, so neither is dead code, and every combination of their arms drives
  // through pipeline's funnel. Nothing is admitted — the walk read every arm of both callbacks and the
  // cartesian drives them all through the one entry.
  it('VALID: {two reached, funnelled callbacks} => no dead-surface lint, nothing undriven or dark', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      lints: analysis.lints,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      declaredTypes: analysis.declaredTypes,
    }).toStrictEqual({ lints: [], undriven: [], darkSpots: [], declaredTypes: [] });
  });
});
