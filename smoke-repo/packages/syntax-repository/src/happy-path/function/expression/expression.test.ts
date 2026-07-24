import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'expression.ts'), 'utf8');
const relPath = 'src/happy-path/function/expression/expression.ts';

describe('function / expression — a branching function EXPRESSION assigned to an exported const', () => {
  // The base `function` rung is a branchless `add`; this proves a function EXPRESSION (`const f =
  // function (n) { … }`) bound to an exported const is a first-class DRIVEN entry: exporting the const
  // makes it `access:named`, and its `if` derives the sound pair (n = 6 takes then, n = 5 takes else)
  // exactly as a function declaration would. Nothing about being an expression rather than a declaration
  // changes the analysis.
  it('VALID: {export const classify = function (n) { if (n > 5) … }} => a named, driven entry with both arms', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases }))).toStrictEqual([
      {
        name: 'classify',
        access: { kind: 'named' },
        cases: [
          {
            reachesPath: ['*module*/classify/return@if:BinaryExpression,id:n,GreaterThanToken,num:5#then'],
            arrange: [{ kind: 'param', param: 'n', value: 6 }],
            salient: true,
          },
          {
            reachesPath: ['*module*/classify/return@if:BinaryExpression,id:n,GreaterThanToken,num:5#else'],
            arrange: [{ kind: 'param', param: 'n', value: 5 }],
            salient: true,
          },
        ],
      },
    ]);
  });

  it('VALID: {a driven function expression} => admits nothing', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({ undriven: analysis.undriven, darkSpots: analysis.darkSpots, lints: analysis.lints }).toStrictEqual({
      undriven: [],
      darkSpots: [],
      lints: [],
    });
  });
});
