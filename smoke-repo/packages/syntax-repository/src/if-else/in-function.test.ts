import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'in-function.ts'), 'utf8');

const BRANCH = '*module*/classify/if:BinaryExpression,id:value,GreaterThanToken,num:5';

describe('if-else / in-function — if/else inside an exported function', () => {
  it('VALID: {exported function with if/else} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('in-function.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  it('VALID: {exported function with if/else} => one entry, one gt branch, then/else exits', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/if-else/in-function.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'classify',
            scopePath: ['*module*', 'classify'],
            params: [{ name: 'value', type: { kind: 'number' } }],
            returnType: { kind: 'string' },
            line: 1,
            access: { kind: 'named' },
          },
          branches: [
            {
              coverageId: BRANCH,
              kind: 'if',
              condition: {
                kind: 'leaf',
                id: `${BRANCH}#leaf`,
                operandParamName: 'value',
                operandType: { kind: 'number' },
                predicate: { kind: 'gt', literal: 5 },
              },
              startLine: 2,
              endLine: 4,
            },
          ],
          exits: [
            {
              coverageId: '*module*/classify/return@if:BinaryExpression,id:value,GreaterThanToken,num:5#then',
              kind: 'return',
              guardPath: [{ branchCoverageId: BRANCH, arm: 'then' }],
              line: 3,
            },
            // The trailing return is reachable only when the guard clause did NOT fire, so the
            // walk guards it by that if's `else` rather than leaving it unconditional.
            {
              coverageId: '*module*/classify/return@if:BinaryExpression,id:value,GreaterThanToken,num:5#else',
              kind: 'return',
              guardPath: [{ branchCoverageId: BRANCH, arm: 'else' }],
              line: 6,
            },
          ],
        },
      ],
    });
  });
});
