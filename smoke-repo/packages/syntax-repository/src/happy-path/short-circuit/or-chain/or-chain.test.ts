import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'or-chain.ts'), 'utf8');

const BRANCH_A = '*module*/pick/ternary:id:a';
const BRANCH_B = '*module*/pick/ternary:id:b';
const A_EXIT = '*module*/pick/return@ternary:id:a#then';
const B_EXIT = '*module*/pick/return@ternary:id:a#else/ternary:id:b#then';
const DEFAULT_EXIT = '*module*/pick/return@ternary:id:a#else/ternary:id:b#else';

describe('short-circuit / or-chain — a `||` chain in a block return', () => {
  it('VALID: {block `return a || b || "default"`} => a ternary branch per controlling operand, one exit per path', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/happy-path/short-circuit/or-chain/or-chain.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'pick',
            scopePath: ['*module*', 'pick'],
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
                operandType: { kind: 'string' },
                predicate: { kind: 'truthy' },
              },
              startLine: 2,
              endLine: 2,
            },
          ],
          exits: [
            // `a` truthy short-circuits and returns `a`.
            {
              coverageId: A_EXIT,
              kind: 'return',
              guardPath: [{ branchCoverageId: BRANCH_A, arm: 'then' }],
              line: 2,
            },
            // `a` empty, `b` truthy returns `b`.
            {
              coverageId: B_EXIT,
              kind: 'return',
              guardPath: [
                { branchCoverageId: BRANCH_A, arm: 'else' },
                { branchCoverageId: BRANCH_B, arm: 'then' },
              ],
              line: 2,
            },
            // Both empty falls through to the last operand `'default'` — no branch of its own.
            {
              coverageId: DEFAULT_EXIT,
              kind: 'return',
              guardPath: [
                { branchCoverageId: BRANCH_A, arm: 'else' },
                { branchCoverageId: BRANCH_B, arm: 'else' },
              ],
              line: 2,
            },
          ],
        },
      ],
    });
  });
});
