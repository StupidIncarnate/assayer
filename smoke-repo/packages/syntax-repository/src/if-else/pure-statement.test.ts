import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'pure-statement.ts'), 'utf8');

const BRANCH = '*module*/if:BinaryExpression,id:value,GreaterThanToken,num:5';

describe('if-else / pure-statement — bare top-level if/else', () => {
  it('VALID: {bare top-level if/else} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('pure-statement.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  // The `if` is in TAIL position — nothing runs after it — so each arm merely COMPLETING ends the
  // module, and each completion is its own exit worth a case. That single rule is why bare
  // top-level code needs no rung-specific derivation of its own.
  it('VALID: {bare top-level if/else} => a *module* void entry, one if branch, per-arm implicit exits', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/if-else/pure-statement.ts' });
    expect(result).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: '*module*',
            scopePath: ['*module*'],
            params: [],
            returnType: { kind: 'unknown', text: 'void' },
            line: 1,
          },
          branches: [
            {
              coverageId: BRANCH,
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
              coverageId: `${BRANCH.replace('/if:', '/exit@if:')}#then`,
              kind: 'implicit',
              guardPath: [{ branchCoverageId: BRANCH, arm: 'then' }],
              line: 4,
            },
            {
              coverageId: `${BRANCH.replace('/if:', '/exit@if:')}#else`,
              kind: 'implicit',
              guardPath: [{ branchCoverageId: BRANCH, arm: 'else' }],
              line: 6,
            },
          ],
        },
      ],
    });
  });
});
