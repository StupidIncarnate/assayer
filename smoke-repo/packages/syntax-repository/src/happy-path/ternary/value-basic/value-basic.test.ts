import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'value-basic.ts'), 'utf8');

// The whole point of value-flow: `const label = n > 5 ? 'big' : 'small'; return label` collapses to the
// SAME split an exit-position ternary gets, so its IDs are identical to `ternary/return-basic` — the
// binding never appears, the condition is the branch, each arm a guarded return.
const BRANCH = '*module*/classify/ternary:BinaryExpression,id:n,GreaterThanToken,num:5';
const THEN_EXIT = '*module*/classify/return@ternary:BinaryExpression,id:n,GreaterThanToken,num:5#then';
const ELSE_EXIT = '*module*/classify/return@ternary:BinaryExpression,id:n,GreaterThanToken,num:5#else';

describe('ternary / value-basic — a value-flow `const x = ternary; return x` tail', () => {
  it('VALID: {`const label = n > 5 ? a : b; return label`} => one ternary branch, then/else return exits, no dark spot', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/happy-path/ternary/value-basic/value-basic.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'classify',
            scopePath: ['*module*', 'classify'],
            params: [{ name: 'n', type: { kind: 'number' } }],
            returnType: { kind: 'string' },
            line: 1,
            access: { kind: 'named' },
          },
          branches: [
            {
              coverageId: BRANCH,
              kind: 'ternary',
              condition: {
                kind: 'leaf',
                id: `${BRANCH}#leaf`,
                operandParamName: 'n',
                operandType: { kind: 'number' },
                predicate: { kind: 'gt', literal: 5 },
              },
              startLine: 2,
              endLine: 2,
            },
          ],
          exits: [
            {
              coverageId: THEN_EXIT,
              kind: 'return',
              guardPath: [{ branchCoverageId: BRANCH, arm: 'then' }],
              line: 2,
            },
            {
              coverageId: ELSE_EXIT,
              kind: 'return',
              guardPath: [{ branchCoverageId: BRANCH, arm: 'else' }],
              line: 2,
            },
          ],
        },
      ],
    });
  });
});
