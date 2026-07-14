import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { tsMorphExtractAnalysisAdapter } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'pure-statement.ts'), 'utf8');

describe('switch / pure-statement — bare top-level switch', () => {
  it('VALID: {bare top-level switch} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('pure-statement.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  it('VALID: {bare top-level switch} => a *module* void entry, one switch branch, per-arm implicit exits', () => {
    const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/switch/pure-statement.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: { name: '*module*', params: [], returnType: { kind: 'unknown', text: 'void' }, line: 1 },
          branches: [
            {
              coverageId: '*module*/switch:id:method,EqualsEqualsEqualsToken,str:get',
              kind: 'switch',
              operandParamName: 'method',
              operandType: { kind: 'string' },
              predicate: { kind: 'eq', literal: 'get' },
              startLine: 4,
              endLine: 6,
            },
          ],
          exits: [
            {
              coverageId: '*module*/exit@switch:str:get',
              kind: 'implicit',
              guardPath: [
                { branchCoverageId: '*module*/switch:id:method,EqualsEqualsEqualsToken,str:get', arm: 'then' },
              ],
              line: 5,
            },
            {
              coverageId: '*module*/exit@switch:default',
              kind: 'implicit',
              guardPath: [
                { branchCoverageId: '*module*/switch:id:method,EqualsEqualsEqualsToken,str:get', arm: 'else' },
              ],
              line: 8,
            },
          ],
        },
      ],
    });
  });
});
