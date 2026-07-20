import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'return-nested.ts'), 'utf8');

const OUTER = '*module*/grade/ternary:BinaryExpression,id:g,GreaterThanEqualsToken,num:90';
const INNER = '*module*/grade/ternary:BinaryExpression,id:g,GreaterThanEqualsToken,num:80';
const THEN_EXIT = '*module*/grade/return@ternary:BinaryExpression,id:g,GreaterThanEqualsToken,num:90#then';
const NESTED_THEN_EXIT =
  '*module*/grade/return@ternary:BinaryExpression,id:g,GreaterThanEqualsToken,num:90#else/ternary:BinaryExpression,id:g,GreaterThanEqualsToken,num:80#then';
const NESTED_ELSE_EXIT =
  '*module*/grade/return@ternary:BinaryExpression,id:g,GreaterThanEqualsToken,num:90#else/ternary:BinaryExpression,id:g,GreaterThanEqualsToken,num:80#else';

describe('ternary / return-nested — a ternary nested in the else arm', () => {
  it('VALID: {`return g >= 90 ? a : g >= 80 ? b : c`} => two ternary branches, three per-leaf exits', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/happy-path/ternary/return-nested/return-nested.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'grade',
            scopePath: ['*module*', 'grade'],
            params: [{ name: 'g', type: { kind: 'number' } }],
            returnType: { kind: 'string' },
            line: 1,
            access: { kind: 'named' },
          },
          branches: [
            {
              coverageId: OUTER,
              kind: 'ternary',
              condition: {
                kind: 'leaf',
                id: `${OUTER}#leaf`,
                operandParamName: 'g',
                operandType: { kind: 'number' },
                predicate: { kind: 'gte', literal: 90 },
              },
              startLine: 2,
              endLine: 2,
            },
            {
              coverageId: INNER,
              kind: 'ternary',
              condition: {
                kind: 'leaf',
                id: `${INNER}#leaf`,
                operandParamName: 'g',
                operandType: { kind: 'number' },
                predicate: { kind: 'gte', literal: 80 },
              },
              startLine: 2,
              endLine: 2,
            },
          ],
          exits: [
            {
              coverageId: THEN_EXIT,
              kind: 'return',
              guardPath: [{ branchCoverageId: OUTER, arm: 'then' }],
              line: 2,
            },
            {
              coverageId: NESTED_THEN_EXIT,
              kind: 'return',
              guardPath: [
                { branchCoverageId: OUTER, arm: 'else' },
                { branchCoverageId: INNER, arm: 'then' },
              ],
              line: 2,
            },
            {
              coverageId: NESTED_ELSE_EXIT,
              kind: 'return',
              guardPath: [
                { branchCoverageId: OUTER, arm: 'else' },
                { branchCoverageId: INNER, arm: 'else' },
              ],
              line: 2,
            },
          ],
        },
      ],
    });
  });
});
