import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'basic.ts'), 'utf8');

const BRANCH = '*module*/len/ternary:PropertyAccessExpression,id:s,QuestionDotToken,id:length';
const THEN_EXIT = '*module*/len/return@ternary:PropertyAccessExpression,id:s,QuestionDotToken,id:length#then';
const ELSE_EXIT = '*module*/len/return@ternary:PropertyAccessExpression,id:s,QuestionDotToken,id:length#else';

// The hermetic walk parses with strict-null-checks on, so `string | null` arrives as a genuine
// two-member union rather than collapsing to plain `string`. `read-type-fact-layer-transformer` has no
// dedicated case for the null type, so its member reads through the generic opaque path as `{ kind:
// 'unknown', text: 'null' }`, sitting beside the real `{ kind: 'string' }` member. Same shape for
// `number | undefined`, with `undefined` in place of `null`.
const NULLABLE_STRING = { kind: 'union', members: [{ kind: 'unknown', text: 'null' }, { kind: 'string' }] };
const OPTIONAL_NUMBER = { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] };

describe('optional-chain / basic — a single-level `a?.b` in a block return', () => {
  it("VALID: {block `return s?.length`} => a ternary branch on the receiver's non-nullishness, one exit per path", () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/happy-path/optional-chain/basic/basic.ts', absPath: join(__dirname, 'basic.ts') });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'len',
            scopePath: ['*module*', 'len'],
            // `declaredText` is the SIGNATURE's own rendering, riding beside the descriptor for a P1
            // message to name — unaffected by whichever union shape the checker reports.
            params: [{ name: 's', type: NULLABLE_STRING, declaredText: 'string | null' }],
            returnType: OPTIONAL_NUMBER,
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
                operandType: NULLABLE_STRING,
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
