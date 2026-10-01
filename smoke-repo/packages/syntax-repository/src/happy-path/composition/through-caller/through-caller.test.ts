import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'through-caller.ts'), 'utf8');
const relPath = 'src/happy-path/composition/through-caller/through-caller.ts';

describe('composition / through-caller — a private CALLED but not RETURNED, so it cannot fold into a funnel', () => {
  // Bespoke to this file: `report` calls `classify(n)` unconditionally but discards the result — its
  // own exit does not return the call, so `classify` cannot fold into `report`'s case set the way
  // `function/nested`'s `inner` does. The follower instead emits `classify` as its OWN entry, access
  // `through-caller`, driven with `report`'s own `n` threaded straight through — the only shape that
  // reaches `access:through-caller` on an entry at all.
  it('VALID: {report(n) { classify(n); } with classify branching on n} => two entries, classify access through-caller naming report', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'report',
          scopePath: ['*module*', 'report'],
          params: [{ name: 'n', type: { kind: 'number' } }],
          returnType: { kind: 'unknown', text: 'void' },
          line: 9,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/report/exit@top', kind: 'implicit', guardPath: [], line: 11 }],
        cases: [
          {
            reachesPath: ['*module*/report/exit@top'],
            arrange: [{ kind: 'param', param: 'n', value: 7 }],
            salient: true,
          },
        ],
      },
      {
        entry: {
          name: 'classify',
          scopePath: ['*module*', 'classify'],
          params: [{ name: 'n', type: { kind: 'number' } }],
          returnType: { kind: 'string' },
          line: 1,
          access: { kind: 'through-caller', callerName: 'report' },
        },
        branches: [
          {
            coverageId: '*module*/classify/if:BinaryExpression,id:n,GreaterThanToken,num:5',
            kind: 'if',
            condition: {
              kind: 'leaf',
              id: '*module*/classify/if:BinaryExpression,id:n,GreaterThanToken,num:5#leaf',
              operandParamName: 'n',
              operandType: { kind: 'number' },
              predicate: { kind: 'gt', literal: 5 },
            },
            startLine: 2,
            endLine: 4,
          },
        ],
        exits: [
          {
            coverageId: '*module*/classify/return@if:BinaryExpression,id:n,GreaterThanToken,num:5#then',
            kind: 'return',
            guardPath: [{ branchCoverageId: '*module*/classify/if:BinaryExpression,id:n,GreaterThanToken,num:5', arm: 'then' }],
            line: 3,
          },
          {
            coverageId: '*module*/classify/return@if:BinaryExpression,id:n,GreaterThanToken,num:5#else',
            kind: 'return',
            guardPath: [{ branchCoverageId: '*module*/classify/if:BinaryExpression,id:n,GreaterThanToken,num:5', arm: 'else' }],
            line: 6,
          },
        ],
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

  it('VALID: {a driven through-caller entry} => nothing admitted', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect({
      gaps: analysis.gaps,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ gaps: [], darkSpots: [], undriven: [], lints: [] });
  });
});
