import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'arrow-basic.ts'), 'utf8');

const BRANCH = '*module*/classify/ternary:BinaryExpression,id:n,GreaterThanToken,num:5';
const THEN_EXIT = '*module*/classify/return@ternary:BinaryExpression,id:n,GreaterThanToken,num:5#then';
const ELSE_EXIT = '*module*/classify/return@ternary:BinaryExpression,id:n,GreaterThanToken,num:5#else';

describe('ternary / arrow-basic — a concise-arrow body that IS a ternary', () => {
  it('VALID: {`(n) => n > 5 ? a : b`} => the exit-owning arrow splits into then/else return exits', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/happy-path/ternary/arrow-basic/arrow-basic.ts' });
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
              startLine: 1,
              endLine: 1,
            },
          ],
          exits: [
            {
              coverageId: THEN_EXIT,
              kind: 'return',
              guardPath: [{ branchCoverageId: BRANCH, arm: 'then' }],
              line: 1,
            },
            {
              coverageId: ELSE_EXIT,
              kind: 'return',
              guardPath: [{ branchCoverageId: BRANCH, arm: 'else' }],
              line: 1,
            },
          ],
        },
      ],
    });
  });
});
