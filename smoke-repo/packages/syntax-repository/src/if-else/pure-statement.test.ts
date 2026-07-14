import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { tsMorphExtractAnalysisAdapter } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'pure-statement.ts'), 'utf8');

describe('if-else / pure-statement — bare top-level if/else', () => {
  it('VALID: {bare top-level if/else} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('pure-statement.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  it('VALID: {bare top-level if/else} => a *module* void entry, one if branch, per-arm implicit exits', () => {
    const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/if-else/pure-statement.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: { name: '*module*', params: [], returnType: { kind: 'unknown', text: 'void' }, line: 1 },
          branches: [
            {
              coverageId: '*module*/if:BinaryExpression,id:value,GreaterThanToken,num:5',
              kind: 'if',
              operandParamName: 'value',
              operandType: { kind: 'number' },
              predicate: { kind: 'gt', literal: 5 },
              startLine: 3,
              endLine: 7,
            },
          ],
          exits: [
            {
              coverageId: '*module*/exit@if-then',
              kind: 'implicit',
              guardPath: [
                { branchCoverageId: '*module*/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' },
              ],
              line: 4,
            },
            {
              coverageId: '*module*/exit@if-else',
              kind: 'implicit',
              guardPath: [
                { branchCoverageId: '*module*/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'else' },
              ],
              line: 6,
            },
          ],
        },
      ],
    });
  });
});
