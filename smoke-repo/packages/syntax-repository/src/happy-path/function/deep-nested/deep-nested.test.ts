import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'deep-nested.ts'), 'utf8');
const relPath = 'src/happy-path/function/deep-nested/deep-nested.ts';

// The exits the funnel threads through: inner's two arms (keyed on `i > 10`), middle's then-arm
// (`return inner(m)`, keyed on `m > 5`) and its else fall-through (`return 'low'`), and outer's return.
const INNER_THEN = '*module*/middle/inner/return@if:BinaryExpression,id:i,GreaterThanToken,num:10#then';
const INNER_ELSE = '*module*/middle/inner/return@if:BinaryExpression,id:i,GreaterThanToken,num:10#else';
const MIDDLE_THEN = '*module*/middle/return@if:BinaryExpression,id:m,GreaterThanToken,num:5#then';
const MIDDLE_ELSE = '*module*/middle/return@if:BinaryExpression,id:m,GreaterThanToken,num:5#else';
const OUTER_RETURN = '*module*/outer/return@top';

describe('function / deep-nested — a private returning a private funnelled TRANSITIVELY through the surface', () => {
  // THE transitive capability — a function in a function in a function. `outer` returns `middle(value)`
  // and `middle` returns `inner(m)`, so neither private can be reached without calling `outer`: BOTH
  // hops funnel into `outer`, the SOLE entry. Each case predicts the full ordered path — inner's exit,
  // then middle's, then outer's return — and arranges `outer`'s own param to the value that steers every
  // hop at once: > 10 reaches inner's then through middle's then; 5 < v <= 10 reaches inner's else the
  // same way; v <= 5 never reaches inner, taking middle's else fall-through.
  it('VALID: {outer returns middle returns inner} => outer is the sole entry funnelling both hops', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect(
      analysis.functions.map((fn) => ({ name: String(fn.entry.name), access: fn.entry.access, branches: fn.branches, cases: fn.cases })),
    ).toStrictEqual([
      {
        name: 'outer',
        access: { kind: 'named' },
        branches: [],
        cases: [
          { reachesPath: [INNER_THEN, MIDDLE_THEN, OUTER_RETURN], arrange: [{ kind: 'param', param: 'value', value: 11 }], salient: true },
          { reachesPath: [INNER_ELSE, MIDDLE_THEN, OUTER_RETURN], arrange: [{ kind: 'param', param: 'value', value: 10 }], salient: true },
          { reachesPath: [MIDDLE_ELSE, OUTER_RETURN], arrange: [{ kind: 'param', param: 'value', value: 5 }], salient: true },
        ],
      },
    ]);
  });

  // Neither `middle` nor `inner` is a separate entry — both funnel into `outer`, and `outer` itself is
  // branchless. Nothing is admitted on any channel: the two hops are fully driven through the surface.
  it('VALID: {both funnelled privates} => outer is the only entry and nothing is admitted', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect({
      names: analysis.functions.map((fn) => String(fn.entry.name)),
      undriven: analysis.undriven,
      lints: analysis.lints,
      darkSpots: analysis.darkSpots,
    }).toStrictEqual({ names: ['outer'], undriven: [], lints: [], darkSpots: [] });
  });
});
