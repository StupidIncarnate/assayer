import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { tsMorphExtractAnalysisAdapter } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'in-function.ts'), 'utf8');

describe('if-else / in-function — if/else inside an exported function', () => {
  it('VALID: {exported function with if/else} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('in-function.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  it('VALID: {exported function with if/else} => one entry, one gt branch, then/else exits', () => {
    const result = tsMorphExtractAnalysisAdapter({ source, relPath: 'src/if-else/in-function.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'classify',
            params: [{ name: 'value', type: { kind: 'number' } }],
            returnType: { kind: 'string' },
            line: 1,
          },
          branches: [
            {
              coverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5',
              kind: 'if',
              operandParamName: 'value',
              operandType: { kind: 'number' },
              predicate: { kind: 'gt', literal: 5 },
              startLine: 2,
              endLine: 4,
            },
          ],
          exits: [
            {
              coverageId: 'classify/return@if-then',
              kind: 'return',
              guardPath: [
                { branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' },
              ],
              line: 3,
            },
            {
              coverageId: 'classify/return@if-else',
              kind: 'return',
              guardPath: [
                { branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'else' },
              ],
              line: 6,
            },
          ],
        },
      ],
    });
  });
});
