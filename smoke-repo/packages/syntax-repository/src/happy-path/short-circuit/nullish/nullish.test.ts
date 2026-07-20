import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'nullish.ts'), 'utf8');

const BRANCH_A = '*module*/orElse/ternary:id:a';
const A_EXIT = '*module*/orElse/return@ternary:id:a#then';
const B_EXIT = '*module*/orElse/return@ternary:id:a#else';

describe('short-circuit / nullish — a `??` in a block return', () => {
  it('VALID: {block `return a ?? b`} => a ternary branch on the operand\'s non-nullishness, one exit per path', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/happy-path/short-circuit/nullish/nullish.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'orElse',
            scopePath: ['*module*', 'orElse'],
            params: [
              { name: 'a', type: { kind: 'string' } },
              { name: 'b', type: { kind: 'string' } },
            ],
            returnType: { kind: 'string' },
            line: 1,
            access: { kind: 'named' },
          },
          branches: [
            {
              coverageId: BRANCH_A,
              kind: 'ternary',
              condition: {
                kind: 'leaf',
                id: `${BRANCH_A}#leaf`,
                operandParamName: 'a',
                operandType: { kind: 'string' },
                predicate: { kind: 'non-nullish' },
              },
              startLine: 2,
              endLine: 2,
            },
          ],
          exits: [
            // `a` non-nullish short-circuits and returns `a`.
            {
              coverageId: A_EXIT,
              kind: 'return',
              guardPath: [{ branchCoverageId: BRANCH_A, arm: 'then' }],
              line: 2,
            },
            // `a` null/undefined falls through to the last operand `b` — no branch of its own.
            {
              coverageId: B_EXIT,
              kind: 'return',
              guardPath: [{ branchCoverageId: BRANCH_A, arm: 'else' }],
              line: 2,
            },
          ],
        },
      ],
    });
  });
});
