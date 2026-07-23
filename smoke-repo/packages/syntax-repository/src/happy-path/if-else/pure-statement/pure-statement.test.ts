import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { analyzeExtractBroker } from '@assayer/core/extract-analysis';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'pure-statement.ts'), 'utf8');
const relPath = 'src/happy-path/if-else/pure-statement/pure-statement.ts';

const BRANCH = '*module*/if:BinaryExpression,id:value,GreaterThanToken,num:5';
const THEN = `${BRANCH.replace('/if:', '/exit@if:')}#then`;
const ELSE = `${BRANCH.replace('/if:', '/exit@if:')}#else`;

describe('if-else / pure-statement — bare top-level if/else on an operand read from the environment', () => {
  // The `if` is in TAIL position — nothing runs after it — so each arm merely COMPLETING ends the
  // module, and each completion is its own exit worth a case. That single rule is why bare
  // top-level code needs no rung-specific derivation of its own.
  it('VALID: {bare top-level if/else} => a *module* void entry, one if branch, per-arm implicit exits', () => {
    const result = analyzeExtractBroker({ source, relPath });
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
            // Importing the module runs it, so it IS reached — access says how, never whether
            // reaching it proves anything. Here it does: the operand comes from outside the file,
            // so a case that sets it before the import picks the arm.
            access: { kind: 'module' },
          },
          branches: [
            {
              coverageId: BRANCH,
              kind: 'if',
              condition: {
                kind: 'leaf',
                id: `${BRANCH}#leaf`,
                operandParamName: 'value',
                operandEnvVarName: 'VALUE',
                operandType: { kind: 'number' },
                predicate: { kind: 'gt', literal: 5 },
              },
              startLine: 3,
              endLine: 7,
            },
          ],
          exits: [
            {
              coverageId: THEN,
              kind: 'implicit',
              guardPath: [{ branchCoverageId: BRANCH, arm: 'then' }],
              line: 4,
            },
            {
              coverageId: ELSE,
              kind: 'implicit',
              guardPath: [{ branchCoverageId: BRANCH, arm: 'else' }],
              line: 6,
            },
          ],
        },
      ],
    });
  });

  // Where the operand COMES FROM is the whole difference between drivable and not, and the leaf is
  // where that fact lands. The operand's TYPE is read exactly as any other binding's is (widened,
  // off the type graph); naming the variable it was read from is what makes the arms reachable.
  it('VALID: {const value = Number(process.env.VALUE)} => the leaf names the env var it reads', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.branches).map((branch) => branch.condition)).toStrictEqual([
      {
        kind: 'leaf',
        id: `${BRANCH}#leaf`,
        operandParamName: 'value',
        operandEnvVarName: 'VALUE',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 5 },
      },
    ]);
  });

  // THE payoff, and the reason this rung is worth a specimen. Each case sets the one input the file
  // reads, so both arms are real: `Number('6') > 5` takes the then arm and `Number('5') > 5` takes
  // the else. The values are the inverse of the source's own coercion, never a recording of what
  // running it produced (P4).
  it('VALID: {env-read operand} => one case per arm, each SETTING the variable that chooses it', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesExit: THEN, arrange: [{ kind: 'env', name: 'VALUE', value: '6' }], salient: true },
      { reachesExit: ELSE, arrange: [{ kind: 'env', name: 'VALUE', value: '5' }], salient: true },
    ]);
  });

  // A file whose top-level branching Assayer drives owes no undriven line, or the run both drives it
  // and admits it cannot. `happy-path/switch/pure-statement/pure-statement.ts` is the rung that holds the other side: its
  // operand is welded to a literal, and it is admitted rather than driven.
  it('VALID: {a module scope Assayer drives} => nothing is admitted as undriven', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.undriven).toStrictEqual([]);
  });
});
