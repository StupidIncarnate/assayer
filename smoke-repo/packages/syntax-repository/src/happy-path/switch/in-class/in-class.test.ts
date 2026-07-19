import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'in-class.ts'), 'utf8');

const methodUnion = {
  kind: 'union',
  members: [
    { kind: 'literal', value: 'get' },
    { kind: 'literal', value: 'post' },
    { kind: 'literal', value: 'delete' },
  ],
};

const GET = '*module*/Router/routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get';
const POST = '*module*/Router/routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post';

describe('switch / in-class — switch inside an exported class method', () => {
  // Previously a declared GAP. The switch handler needed no knowledge of classes and the class
  // handler needed no knowledge of switches — the walk composes them.
  it('VALID: {exported class method with switch} => the same analysis as a function, under the class path', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/happy-path/switch/in-class/in-class.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'routeLabel',
            scopePath: ['*module*', 'Router', 'routeLabel'],
            params: [{ name: 'method', type: methodUnion }],
            returnType: { kind: 'string' },
            line: 2,
            access: { kind: 'method', className: 'Router', constructable: true },
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
              startLine: 4,
              endLine: 5,
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
              startLine: 6,
              endLine: 7,
            },
          ],
          exits: [
            {
              coverageId: `${GET.replace('/switch:', '/return@switch:')}#then`,
              kind: 'return',
              guardPath: [{ branchCoverageId: GET, arm: 'then' }],
              line: 5,
            },
            {
              coverageId: `${POST.replace('/switch:', '/return@switch:')}#then`,
              kind: 'return',
              guardPath: [{ branchCoverageId: POST, arm: 'then' }],
              line: 7,
            },
            {
              coverageId:
                '*module*/Router/routeLabel/return@switch:id:method,EqualsEqualsEqualsToken,str:get#else/switch:id:method,EqualsEqualsEqualsToken,str:post#else',
              kind: 'return',
              guardPath: [
                { branchCoverageId: GET, arm: 'else' },
                { branchCoverageId: POST, arm: 'else' },
              ],
              line: 9,
            },
          ],
        },
      ],
    });
  });
});
