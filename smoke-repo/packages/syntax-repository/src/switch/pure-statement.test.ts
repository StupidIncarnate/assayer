import { readFileSync } from 'fs';
import { join } from 'path';

import { Project } from 'ts-morph';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'pure-statement.ts'), 'utf8');

const GET = '*module*/switch:id:method,EqualsEqualsEqualsToken,str:get';

describe('switch / pure-statement — bare top-level switch', () => {
  it('VALID: {bare top-level switch} => 0 syntactic diagnostics (valid TypeScript)', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('pure-statement.ts', source);
    const diagnostics = project.getProgram().getSyntacticDiagnostics(sourceFile);
    expect(diagnostics.length).toBe(0);
  });

  // Same tail-position rule as the bare `if`: the switch is the last thing that runs, so a clause
  // merely falling out of it ends the module and is an exit worth a case.
  it('VALID: {bare top-level switch} => a *module* void entry, one switch branch, per-arm implicit exits', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/switch/pure-statement.ts' });
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
            access: { kind: 'unreachable' },
          },
          branches: [
            {
              coverageId: GET,
              kind: 'switch',
              condition: {
                kind: 'leaf',
                id: `${GET}#leaf`,
                operandParamName: 'method',
                operandType: { kind: 'string' },
                predicate: { kind: 'eq', literal: 'get' },
              },
              startLine: 4,
              endLine: 6,
            },
          ],
          exits: [
            {
              coverageId: `${GET.replace('/switch:', '/exit@switch:')}#then`,
              kind: 'implicit',
              guardPath: [{ branchCoverageId: GET, arm: 'then' }],
              line: 5,
            },
            {
              coverageId: `${GET.replace('/switch:', '/exit@switch:')}#else`,
              kind: 'implicit',
              guardPath: [{ branchCoverageId: GET, arm: 'else' }],
              line: 8,
            },
          ],
        },
      ],
    });
  });
});
