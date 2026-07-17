import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'in-class.ts'), 'utf8');

const BRANCH = '*module*/Classifier/classify/if:BinaryExpression,id:value,GreaterThanToken,num:5';

describe('if-else / in-class — if/else inside an exported class method', () => {
  // The class rung was a declared GAP under the old flat per-kind scans, which could only ever
  // start from an exported top-level function. The walk carries scope down, so a method is just a
  // function-like at a greater depth and needed no new derivation — only a longer scope path.
  it('VALID: {exported class method with if/else} => the same analysis as a function, under the class path', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/if-else/in-class.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'classify',
            scopePath: ['*module*', 'Classifier', 'classify'],
            params: [{ name: 'value', type: { kind: 'number' } }],
            returnType: { kind: 'string' },
            line: 2,
            // Reached through an instance, not as a module property — and the zero-arg class means
            // the runner can build one, so this method is drivable rather than a gap.
            access: { kind: 'method', className: 'Classifier', constructable: true },
          },
          branches: [
            {
              coverageId: BRANCH,
              kind: 'if',
              condition: {
                kind: 'leaf',
                id: `${BRANCH}#leaf`,
                operandParamName: 'value',
                operandType: { kind: 'number' },
                predicate: { kind: 'gt', literal: 5 },
              },
              startLine: 3,
              endLine: 5,
            },
          ],
          exits: [
            {
              coverageId: `${BRANCH.replace('/if:', '/return@if:')}#then`,
              kind: 'return',
              guardPath: [{ branchCoverageId: BRANCH, arm: 'then' }],
              line: 4,
            },
            {
              coverageId: `${BRANCH.replace('/if:', '/return@if:')}#else`,
              kind: 'return',
              guardPath: [{ branchCoverageId: BRANCH, arm: 'else' }],
              line: 7,
            },
          ],
        },
      ],
    });
  });
});
