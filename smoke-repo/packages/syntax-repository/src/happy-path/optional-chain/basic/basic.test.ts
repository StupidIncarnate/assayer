import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'basic.ts'), 'utf8');

const BRANCH = '*module*/len/ternary:PropertyAccessExpression,id:s,QuestionDotToken,id:length';
const THEN_EXIT = '*module*/len/return@ternary:PropertyAccessExpression,id:s,QuestionDotToken,id:length#then';
const ELSE_EXIT = '*module*/len/return@ternary:PropertyAccessExpression,id:s,QuestionDotToken,id:length#else';

describe('optional-chain / basic — a single-level `a?.b` in a block return', () => {
  it("VALID: {block `return s?.length`} => a ternary branch on the receiver's non-nullishness, one exit per path", () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/happy-path/optional-chain/basic/basic.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'len',
            scopePath: ['*module*', 'len'],
            params: [{ name: 's', type: { kind: 'string' } }],
            returnType: { kind: 'number' },
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
                operandParamName: 's',
                operandType: { kind: 'string' },
                predicate: { kind: 'non-nullish' },
              },
              startLine: 2,
              endLine: 2,
            },
          ],
          exits: [
            // `s` non-nullish returns `s.length`.
            {
              coverageId: THEN_EXIT,
              kind: 'return',
              guardPath: [{ branchCoverageId: BRANCH, arm: 'then' }],
              line: 2,
            },
            // `s` null/undefined short-circuits the access to `undefined`.
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
