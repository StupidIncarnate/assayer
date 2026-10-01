import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'uncalled-nested.ts'), 'utf8');
const relPath = 'src/sad-path/dead-surface/uncalled-nested/uncalled-nested.ts';

// Verbatim. `unused` is nested inside `outer`, but `outer` never calls it and it is passed nowhere — so
// nothing reaches it and nothing ever will. This is the CONTRAST that keeps the callback fix honest: a
// nested function that looks structurally like a callback is STILL dead surface when the code does not
// reach it. Being nested does not rescue it, and being reached (as an argument, as in
// undriven/hof-callback, or over an array, as in array/map-conditional) is exactly what separates a
// driven or undriven callback from this dead one.
const DEAD_SURFACE_MESSAGE =
  'nothing in this file calls it, so it is dead surface: an unexported helper is reachable only from ' +
  'its own file, and nothing here reaches it. Delete it, or consume it from a caller that passes an ' +
  'input straight through — which the follower would then drive.';

describe('dead-surface / uncalled-nested — a nested function nothing reaches', () => {
  // THE lint, on a NESTED private. It rides the lint channel — "change the code" — never undriven or a
  // dark spot: the walk read `unused` and its `if` perfectly, and no caller or callback reference
  // reaches it.
  it('VALID: {a nested function reached by nobody} => emitted as a dead-surface lint', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect(analysis.lints).toStrictEqual([
      { rule: 'dead-surface', name: 'unused', message: DEAD_SURFACE_MESSAGE, startLine: 2, endLine: 8 },
    ]);
  });

  it('VALID: {dead nested code beside real code} => nothing undriven, nothing dark, only outer driven', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect({
      functions: analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases })),
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
    }).toStrictEqual({
      functions: [
        {
          name: 'outer',
          access: { kind: 'named' },
          cases: [{ reachesPath: ['*module*/outer/return@top'], arrange: [{ kind: 'param', param: 'value', value: 7 }], salient: true }],
        },
      ],
      undriven: [],
      darkSpots: [],
    });
  });
});
