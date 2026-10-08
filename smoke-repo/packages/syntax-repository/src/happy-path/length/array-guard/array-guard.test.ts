import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'array-guard.ts'), 'utf8');
const relPath = 'src/happy-path/length/array-guard/array-guard.ts';

const BRANCH = '*module*/classify/if:BinaryExpression,PropertyAccessExpression,id:xs,id:length,GreaterThanToken,num:3';
const THEN = `${BRANCH.replace('/if:', '/return@if:')}#then`;
const ELSE = `${BRANCH.replace('/if:', '/return@if:')}#else`;

describe('length / array-guard — a `.length` comparison on an ARRAY param, the array twin of bounded-name', () => {
  // The length axis is read off `.length` the same way regardless of the operand's own type — the leaf
  // still carries the array's element type as `operandType`, so the length predicate is legible on an
  // array exactly as it is on a string.
  it('VALID: {xs.length > 3} => a length-gt leaf over the array param', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'array-guard.ts') }), relPath });

    expect(analysis.functions[0]?.branches[0]?.condition).toStrictEqual({
      kind: 'leaf',
      id: `${BRANCH}#leaf`,
      operandParamName: 'xs',
      operandType: { kind: 'array', element: { kind: 'string' } },
      predicate: { kind: 'length-gt', literal: 3 },
    });
  });

  // THE PAYOFF. An array has no scalar point, so a `.length` guard on it can only be realized by
  // building a real array AT a permitted length — never the cardinality fan-out's own empty/one/many
  // classes, which top out at two elements and can never reach `length > 3`. Each arm now arranges an
  // array whose length actually decides that arm: four elements for `#then`, none for `#else`.
  it('VALID: {xs.length > 3} => then arranges a 4-element array and else arranges the empty array', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'array-guard.ts') }), relPath });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      {
        reachesPath: [THEN],
        arrange: [{ kind: 'array', param: 'xs', value: ['abc123', 'abc123_1', 'abc123_2', 'abc123_3'] }],
        salient: true,
      },
      { reachesPath: [ELSE], arrange: [{ kind: 'array', param: 'xs', value: [] }], salient: true },
    ]);
  });

  it('VALID: {an array length guard} => nothing admitted: no dark spot, no gap, no undriven, no lint', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'array-guard.ts') }), relPath });

    expect({
      darkSpots: analysis.darkSpots,
      gaps: analysis.gaps,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ darkSpots: [], gaps: [], undriven: [], lints: [] });
  });
});
