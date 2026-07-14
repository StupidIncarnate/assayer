import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { tsMorphExtractAnalysisAdapter } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'in-function.ts'), 'utf8');

const methodUnion = {
  kind: 'union',
  members: [
    { kind: 'literal', value: 'get' },
    { kind: 'literal', value: 'post' },
    { kind: 'literal', value: 'delete' },
  ],
};

describe('switch / in-function — switch inside an exported function', () => {
  it('VALID: {exported function with switch} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('in-function.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  it('VALID: {switch over a 3-member union} => two eq-branches and case/case/default exits', () => {
    const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/switch/in-function.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'routeLabel',
            params: [{ name: 'method', type: methodUnion }],
            returnType: { kind: 'string' },
            line: 1,
          },
          branches: [
            {
              coverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get',
              kind: 'switch',
              operandParamName: 'method',
              operandType: methodUnion,
              predicate: { kind: 'eq', literal: 'get' },
              startLine: 3,
              endLine: 4,
            },
            {
              coverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post',
              kind: 'switch',
              operandParamName: 'method',
              operandType: methodUnion,
              predicate: { kind: 'eq', literal: 'post' },
              startLine: 5,
              endLine: 6,
            },
          ],
          exits: [
            {
              coverageId: 'routeLabel/return@switch:str:get',
              kind: 'return',
              guardPath: [
                { branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get', arm: 'then' },
              ],
              line: 4,
            },
            {
              coverageId: 'routeLabel/return@switch:str:post',
              kind: 'return',
              guardPath: [
                { branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post', arm: 'then' },
              ],
              line: 6,
            },
            {
              coverageId: 'routeLabel/return@switch:default',
              kind: 'return',
              guardPath: [
                { branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get', arm: 'else' },
                { branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post', arm: 'else' },
              ],
              line: 8,
            },
          ],
        },
      ],
    });
  });
});
