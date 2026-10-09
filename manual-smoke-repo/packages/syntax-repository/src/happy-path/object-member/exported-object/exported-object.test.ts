import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'exported-object.ts'), 'utf8');

const BRANCH = '*module*/grade/if:BinaryExpression,id:score,GreaterThanToken,num:5';

describe('object-member / exported-object — if/else inside a method of an exported object', () => {
  // An importer calls `grader.grade(…)`, so the method is surface, not a private helper nothing reaches.
  // Its access names the object the module exports and the property that holds the method, which is
  // how the runner lays hands on it: `subject.grader.grade`, called with `grader` as `this`.
  it('VALID: {exported object with a branching method} => an entry reached through the object, analysed like a function', () => {
    const result = analyzeExtractBroker({
      source,
      relPath: 'src/happy-path/object-member/exported-object/exported-object.ts',
      absPath: join(__dirname, 'exported-object.ts'),
    });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'grade',
            scopePath: ['*module*', 'grade'],
            params: [{ name: 'score', type: { kind: 'number' } }],
            returnType: { kind: 'string' },
            line: 2,
            access: { kind: 'object-member', objectName: 'grader', property: 'grade' },
          },
          branches: [
            {
              coverageId: BRANCH,
              kind: 'if',
              condition: {
                kind: 'leaf',
                id: `${BRANCH}#leaf`,
                operandParamName: 'score',
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
