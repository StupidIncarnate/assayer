import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'sibling-fill.ts'), 'utf8');
const relPath = 'src/happy-path/array/sibling-fill/sibling-fill.ts';

// `scaleAndAppend` maps a branching callback `(n) => …` over `values` and uses `extra` PASSIVELY
// (`scaled.concat(extra)`) — never mapped. The callback is anonymous, so its scope segment is the
// spelling-invariant STRUCTURAL projection of the arrow (node kinds + leaf values). Coverage IDs are
// cache-internal, so this exact string is not load-bearing; what it pins is that the callback's exits
// attach UNDER scaleAndAppend's scope path, so the funnel threads `*module*/scaleAndAppend/<CB>/…`
// before scaleAndAppend's own return.
const CB =
  'fn:ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,Block,IfStatement,BinaryExpression,id:n,' +
  'GreaterThanToken,num:100,Block,ReturnStatement,BinaryExpression,id:n,AsteriskToken,num:2,' +
  'ReturnStatement,id:n';
const CB_PATH = `*module*/scaleAndAppend/${CB}`;
const GT100 = 'if:BinaryExpression,id:n,GreaterThanToken,num:100';

// The callback's two arms (`n > 100` then / else) and scaleAndAppend's own single return.
const CB_THEN = `${CB_PATH}/return@${GT100}#then`;
const CB_ELSE = `${CB_PATH}/return@${GT100}#else`;
const SURFACE_EXIT = '*module*/scaleAndAppend/return@top';

// The sibling `extra` fill that IS the point of this specimen: a REAL one-element array of the element
// type, laid into every funnel case unchanged. `extra` is a `number[]` param the funnel does not steer,
// so it is FILLED — and an array param must be filled with an array, never a scalar `'abc123'` string
// that `scaled.concat(extra)` would choke on.
const EXTRA_FILL = { kind: 'array', param: 'extra', value: [7] };

describe('array / sibling-fill — `scaleAndAppend` maps a branching callback over `values` while `extra` is a PASSIVE sibling array param', () => {
  // THE capability. The callback branching on `n` cannot be reached without calling scaleAndAppend, so
  // it is no separate entry: its arms FUNNEL into scaleAndAppend's own case set. scaleAndAppend
  // (branchless, single-exit) is the sole entry, and the funnel drives ONLY `values` — `[]` runs the
  // callback zero times (path is the surface exit alone), `[101]` takes the `n > 100` then-arm, `[100]`
  // the else-arm, and `[101, 100]` crosses both arms in one array. `extra` is NOT mapped, so no callback
  // funnels through it; it is filled with the same real one-element array `[7]` in EVERY case. Each value
  // is an INPUT (P4); the case asserts only the reached PATH.
  it('VALID: {a map callback branching on n, plus a passive sibling `extra`} => FUNNELLED into scaleAndAppend, `values` driving each arm while `extra` is filled with a real array', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(
      analysis.functions.map((fn) => ({ name: fn.entry.name, label: fn.entry.label, access: fn.entry.access, cases: fn.cases })),
    ).toStrictEqual([
      {
        name: 'scaleAndAppend',
        label: undefined,
        access: { kind: 'named' },
        cases: [
          { reachesPath: [SURFACE_EXIT], arrange: [{ kind: 'array', param: 'values', value: [] }, EXTRA_FILL], salient: true },
          { reachesPath: [CB_THEN, SURFACE_EXIT], arrange: [{ kind: 'array', param: 'values', value: [101] }, EXTRA_FILL], salient: true },
          { reachesPath: [CB_ELSE, SURFACE_EXIT], arrange: [{ kind: 'array', param: 'values', value: [100] }, EXTRA_FILL], salient: true },
          {
            reachesPath: [CB_THEN, CB_ELSE, SURFACE_EXIT],
            arrange: [{ kind: 'array', param: 'values', value: [101, 100] }, EXTRA_FILL],
            salient: true,
          },
        ],
      },
    ]);
  });

  // The pin THIS specimen exists for, asserted in isolation: the passive sibling array param `extra` is
  // filled with a REAL one-element array `[7]` in every single funnel case — never a scalar `'abc123'`
  // string, which `scaled.concat(extra)` would throw on. `arrange[1]` is `extra`'s binding (source-order
  // params: `values` then `extra`), so this reads exactly the fill under test across the four cases.
  it('VALID: {a passive sibling array param} => filled with a real array `[7]`, never a scalar string, in every funnel case', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases.map((testCase) => testCase.arrange[1]))).toStrictEqual([
      EXTRA_FILL,
      EXTRA_FILL,
      EXTRA_FILL,
      EXTRA_FILL,
    ]);
  });

  // The callback is reached (mapped over `values`), so it is not dead code, and each arm drives through
  // scaleAndAppend's funnel. Nothing is admitted — the walk read every arm, the funnel drives them, and
  // the passive sibling is filled rather than left un-steered.
  it('VALID: {a reached, funnelled callback with a filled sibling} => no dead-surface lint, nothing undriven or dark', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      lints: analysis.lints,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      declaredTypes: analysis.declaredTypes,
    }).toStrictEqual({ lints: [], undriven: [], darkSpots: [], declaredTypes: [] });
  });
});
