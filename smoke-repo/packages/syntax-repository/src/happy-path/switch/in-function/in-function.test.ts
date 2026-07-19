import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'in-function.ts'), 'utf8');

const methodUnion = {
  kind: 'union',
  members: [
    { kind: 'literal', value: 'get' },
    { kind: 'literal', value: 'post' },
    { kind: 'literal', value: 'delete' },
  ],
};

const GET = '*module*/routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get';
const POST = '*module*/routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post';

describe('switch / in-function — switch inside an exported function', () => {
  it('VALID: {switch over a 3-member union} => two eq-branches and case/case/default exits', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/happy-path/switch/in-function/in-function.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'routeLabel',
            scopePath: ['*module*', 'routeLabel'],
            params: [{ name: 'method', type: methodUnion }],
            returnType: { kind: 'string' },
            line: 1,
            access: { kind: 'named' },
          },
          branches: [
            {
              coverageId: GET,
              kind: 'switch',
              condition: {
                kind: 'leaf',
                id: `${GET}#leaf`,
                operandParamName: 'method',
                operandType: methodUnion,
                predicate: { kind: 'eq', literal: 'get' },
              },
              startLine: 3,
              endLine: 4,
            },
            {
              coverageId: POST,
              kind: 'switch',
              condition: {
                kind: 'leaf',
                id: `${POST}#leaf`,
                operandParamName: 'method',
                operandType: methodUnion,
                predicate: { kind: 'eq', literal: 'post' },
              },
              startLine: 5,
              endLine: 6,
            },
          ],
          exits: [
            {
              coverageId: `${GET.replace('/switch:', '/return@switch:')}#then`,
              kind: 'return',
              guardPath: [{ branchCoverageId: GET, arm: 'then' }],
              line: 4,
            },
            {
              coverageId: `${POST.replace('/switch:', '/return@switch:')}#then`,
              kind: 'return',
              guardPath: [{ branchCoverageId: POST, arm: 'then' }],
              line: 6,
            },
            // `default` runs only when EVERY case missed, so it carries the else of all of them —
            // which is what lets case derivation intersect down to the one uncovered member.
            {
              coverageId:
                '*module*/routeLabel/return@switch:id:method,EqualsEqualsEqualsToken,str:get#else/switch:id:method,EqualsEqualsEqualsToken,str:post#else',
              kind: 'return',
              guardPath: [
                { branchCoverageId: GET, arm: 'else' },
                { branchCoverageId: POST, arm: 'else' },
              ],
              line: 8,
            },
          ],
        },
      ],
    });
  });
});
