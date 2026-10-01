import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'nested.ts'), 'utf8');
const relPath = 'src/happy-path/function/nested/nested.ts';

// `inner`'s branch, and the two exits keyed on it. `outer`'s only exit is `return inner(value)`, so
// `inner`'s exits FUNNEL into `outer`: each case reaches inner's own exit first, then outer's return.
const INNER = '*module*/outer/inner/return@if:BinaryExpression,id:n,GreaterThanToken,num:5';
const INNER_THEN = `${INNER}#then`;
const INNER_ELSE = `${INNER}#else`;
const OUTER_RETURN = '*module*/outer/return@top';

describe('function / nested — a nested function funnelled into the caller that returns it', () => {
  // THE capability. `inner` is unexported, so nothing calls it directly — and `outer`'s only exit is
  // `return inner(value)`, so `inner` cannot be reached without calling `outer`. Its steering values
  // FUNNEL into `outer`'s own case set: `outer` is the SOLE entry, its two cases the values that drive
  // inner's arms, each pathing through inner's exit then outer's return, arranged in outer's own param.
  // The trivial `outer` case (value = 7) is SUBSUMED — `inner` is always reached, so it adds no path.
  it('VALID: {outer returns inner(value)} => outer is the sole entry, inner funnelled into its two cases', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect(
      analysis.functions.map((fn) => ({ name: String(fn.entry.name), access: fn.entry.access, branches: fn.branches, cases: fn.cases })),
    ).toStrictEqual([
      {
        name: 'outer',
        access: { kind: 'named' },
        branches: [],
        cases: [
          { reachesPath: [INNER_THEN, OUTER_RETURN], arrange: [{ kind: 'param', param: 'value', value: 6 }], salient: true },
          { reachesPath: [INNER_ELSE, OUTER_RETURN], arrange: [{ kind: 'param', param: 'value', value: 5 }], salient: true },
        ],
      },
    ]);
  });

  // No separate `inner` entry: it funnels into `outer` rather than standing as its own through-caller
  // entry, and `inner`'s `if` never leaks up as a branch of `outer` — `outer` itself is branchless.
  it('VALID: {a funnelled private} => is not a separate entry', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect(analysis.functions.map((fn) => String(fn.entry.name))).toStrictEqual(['outer']);
  });

  // Nothing left to admit: following the call graph funnels `inner`, so the file drives it and admits
  // nothing on any channel. NOT a dark spot — the walk read `inner` and its `if` perfectly.
  it('VALID: {a funnelled private} => admits nothing as undriven, a lint, or a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect({ undriven: analysis.undriven, lints: analysis.lints, darkSpots: analysis.darkSpots }).toStrictEqual({
      undriven: [],
      lints: [],
      darkSpots: [],
    });
  });
});
