import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'and-chain.ts'), 'utf8');

const BRANCH_A = '*module*/all/ternary:id:a';
const BRANCH_B = '*module*/all/ternary:id:b';
const A_EXIT = '*module*/all/return@ternary:id:a#else';
const B_EXIT = '*module*/all/return@ternary:id:a#then/ternary:id:b#else';
const C_EXIT = '*module*/all/return@ternary:id:a#then/ternary:id:b#then';

describe('short-circuit / and-chain — an `&&` chain in a block return', () => {
  it('VALID: {block `return a && b && c`} => a ternary branch per controlling operand, one exit per path', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/happy-path/short-circuit/and-chain/and-chain.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'all',
            scopePath: ['*module*', 'all'],
            params: [
              { name: 'a', type: { kind: 'boolean' } },
              { name: 'b', type: { kind: 'boolean' } },
              { name: 'c', type: { kind: 'boolean' } },
            ],
            returnType: { kind: 'boolean' },
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
                operandType: { kind: 'boolean' },
                predicate: { kind: 'truthy' },
              },
              startLine: 2,
              endLine: 2,
            },
            {
              coverageId: BRANCH_B,
              kind: 'ternary',
              condition: {
                kind: 'leaf',
                id: `${BRANCH_B}#leaf`,
                operandParamName: 'b',
                operandType: { kind: 'boolean' },
                predicate: { kind: 'truthy' },
              },
              startLine: 2,
              endLine: 2,
            },
          ],
          exits: [
            // `a` falsy short-circuits and returns `a`.
            {
              coverageId: A_EXIT,
              kind: 'return',
              guardPath: [{ branchCoverageId: BRANCH_A, arm: 'else' }],
              line: 2,
            },
            // `a` truthy, `b` falsy returns `b`.
            {
              coverageId: B_EXIT,
              kind: 'return',
              guardPath: [
                { branchCoverageId: BRANCH_A, arm: 'then' },
                { branchCoverageId: BRANCH_B, arm: 'else' },
              ],
              line: 2,
            },
            // Both truthy falls through to the last operand `c` — no branch of its own.
            {
              coverageId: C_EXIT,
              kind: 'return',
              guardPath: [
                { branchCoverageId: BRANCH_A, arm: 'then' },
                { branchCoverageId: BRANCH_B, arm: 'then' },
              ],
              line: 2,
            },
          ],
        },
      ],
    });
  });
});
