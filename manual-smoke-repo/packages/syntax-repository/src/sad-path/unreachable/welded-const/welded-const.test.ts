import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'welded-const.ts'), 'utf8');
const relPath = 'src/sad-path/unreachable/welded-const/welded-const.ts';

const BRANCH = '*module*/if:BinaryExpression,id:level,GreaterThanToken,num:5';
const THEN = `${BRANCH.replace('/if:', '/exit@if:')}#then`;

// The lint the analysis carries, verbatim. `level` is welded to `7`, so the `if` on line 3 always
// wins and the `else` on line 6 is dead. The message names the operand and its welded value — never
// "the guards cannot all hold at once", which is false for a single always-true guard — and reads by
// the file's LABEL, not the internal `*module*`.
const UNREACHABLE_MESSAGE =
  '`welded-const.ts` can never reach the exit on line 6: `level` is welded to `7`, so the branch on ' +
  'line 3 always takes its other arm and this one is dead. Either a comparison is wrong, or this arm ' +
  'should be deleted.';

describe('unreachable / welded-const — a module scope whose branch turns on a const welded into its own source', () => {
  // The payoff: the analyzer EVALUATES the welded const rather than shrugging. `level > 5` is always
  // true, so the `then` arm is a real case (importing the module runs it and reaches that exit,
  // arranging nothing — a welded value is fixed in the source, not a settable input), and the `else`
  // arm is dead code on the lint channel. It is NO LONGER admitted undriven: the analyzer knows
  // exactly which arm runs.
  it('VALID: {const level = 7; if (level > 5) {…} else {…}} => the live arm is a case, the dead arm an unreachable-exit lint', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'welded-const.ts') }), relPath });

    expect({
      functions: analysis.functions.map((fn) => ({ name: String(fn.entry.name), access: fn.entry.access, cases: fn.cases })),
      lints: analysis.lints.map((lint) => ({ rule: String(lint.rule), name: String(lint.name), message: String(lint.message), startLine: lint.startLine })),
    }).toStrictEqual({
      functions: [{ name: '*module*', access: { kind: 'module' }, cases: [{ reachesPath: [THEN], arrange: [], salient: true }] }],
      lints: [{ rule: 'unreachable-exit', name: '*module*', message: UNREACHABLE_MESSAGE, startLine: 6 }],
    });
  });

  // The walk RECORDS the welded value on the branch leaf — `operandConstValue: 7` — which is what the
  // derivation reads as a single-value domain. Derived from the source LITERAL (P4-safe), never from
  // executing the code.
  it('VALID: {const level = 7} => the branch leaf carries the welded const value', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'welded-const.ts') }) });

    expect(analysis.functions.flatMap((fn) => fn.branches).map((branch) => branch.condition)).toStrictEqual([
      {
        kind: 'leaf',
        id: `${BRANCH}#leaf`,
        operandParamName: 'level',
        operandConstValue: 7,
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 5 },
      },
    ]);
  });

  // NOT undriven and NOT a dark spot: the walk read this `if` and both arms perfectly, and the analyzer
  // resolved which arm is live. The dead arm rides the LINT channel — the repo's debt to fix — not any
  // of the "Assayer cannot drive this" admissions.
  it('VALID: {a welded const module} => nothing is admitted as undriven or a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'welded-const.ts') }), relPath });

    expect({ undriven: analysis.undriven, darkSpots: analysis.darkSpots }).toStrictEqual({ undriven: [], darkSpots: [] });
  });
});
