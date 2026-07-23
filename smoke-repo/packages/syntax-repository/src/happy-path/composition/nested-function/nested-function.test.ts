import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'nested-function.ts'), 'utf8');
const relPath = 'src/happy-path/composition/nested-function/nested-function.ts';

describe('composition / nested-function — a private driven through the caller that consumes it', () => {
  // REGRESSION GUARD. `inner`'s `if` belongs to `inner`, not to `outer`: `outer` itself has no
  // branches. The driven `inner` entry below carries that `if`; it must never leak up into `outer`.
  it('VALID: {nested function} => the inner if does NOT leak into the outer entry', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });
    const outer = analysis.functions.filter((fn) => String(fn.entry.name) === 'outer');

    expect(outer.flatMap((fn) => fn.branches)).toStrictEqual([]);
  });

  // THE capability. `inner` is unexported, so nothing calls it directly — but `outer` reaches it and
  // passes its own `value` straight in, so `inner`'s branch is DRIVEN through `outer`: each arm is a
  // case that sets `outer`'s input, and the exit it asserts is `inner`'s own.
  it('VALID: {a private reached by passthrough} => is driven THROUGH its caller, arranged in the caller param', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases }))).toStrictEqual([
      {
        name: 'outer',
        access: { kind: 'named' },
        cases: [{ reachesExit: '*module*/outer/return@top', arrange: [{ kind: 'param', param: 'value', value: 7 }], salient: true }],
      },
      {
        name: 'inner',
        access: { kind: 'through-caller', callerName: 'outer' },
        cases: [
          {
            reachesExit: '*module*/outer/inner/return@if:BinaryExpression,id:n,GreaterThanToken,num:5#then',
            arrange: [{ kind: 'param', param: 'value', value: 6 }],
            salient: true,
          },
          {
            reachesExit: '*module*/outer/inner/return@if:BinaryExpression,id:n,GreaterThanToken,num:5#else',
            arrange: [{ kind: 'param', param: 'value', value: 5 }],
            salient: true,
          },
        ],
      },
    ]);
  });

  // The admission is GONE, not merely quieter: following the call graph reaches `inner`, so there is
  // nothing left to admit. A file that once reported an undriven helper now reports a driven one.
  it('VALID: {a private reached by passthrough} => leaves nothing undriven', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.undriven).toStrictEqual([]);
  });

  // NOT a dark spot: the walk read `inner` and its `if` perfectly. Following the calls is a reach
  // question, never a parse one.
  it('VALID: {nested function} => admits nothing as a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.darkSpots).toStrictEqual([]);
  });
});
