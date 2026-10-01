import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'const-array-branch.ts'), 'utf8');
const relPath = 'src/sad-path/unreachable/const-array-branch/const-array-branch.ts';

const BRANCH = '*module*/if:BinaryExpression,PropertyAccessExpression,id:items,id:length,GreaterThanToken,num:2';
const THEN = `${BRANCH.replace('/if:', '/exit@if:')}#then`;

// The lint, verbatim — the array twin of `welded-const`. `items` is welded to `[1, 2, 3]`, so its
// `.length` is a fixed 3; `items.length > 2` is always true and the `else` on line 6 is dead. The
// message names the operand and its fixed LENGTH (never a scalar value), reading by the file's LABEL.
const UNREACHABLE_MESSAGE =
  '`const-array-branch.ts` can never reach the exit on line 6: `items` is welded to a fixed length of ' +
  '3, so the branch on line 3 always takes its other arm and this one is dead. Either a comparison is ' +
  'wrong, or this arm should be deleted.';

describe('unreachable / const-array-branch — a module scope whose branch turns on a welded const array length', () => {
  // The array twin of the payoff: the walk reads `items` as an ARRAY of number and the branch as a
  // `length-gt` predicate, but `items` is welded to `[1, 2, 3]`, so the analyzer EVALUATES it — the
  // fixed length of 3 satisfies `> 2`, so the `then` arm is a real case (arranging nothing) and the
  // `else` arm is dead code on the lint channel. No longer admitted undriven.
  it('VALID: {const items = [1, 2, 3]; if (items.length > 2) {…} else {…}} => the live arm is a case, the dead arm an unreachable-exit lint', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect({
      functions: analysis.functions.map((fn) => ({ name: String(fn.entry.name), access: fn.entry.access, cases: fn.cases })),
      lints: analysis.lints.map((lint) => ({ rule: String(lint.rule), name: String(lint.name), message: String(lint.message), startLine: lint.startLine })),
    }).toStrictEqual({
      functions: [{ name: '*module*', access: { kind: 'module' }, cases: [{ reachesPath: [THEN], arrange: [], salient: true }] }],
      lints: [{ rule: 'unreachable-exit', name: '*module*', message: UNREACHABLE_MESSAGE, startLine: 6 }],
    });
  });

  // The walk RECORDS the welded LENGTH on the branch leaf — `operandConstLength: 3` — the count a
  // `.length` comparison is decided against, derived from the array literal's element count (P4-safe).
  it('VALID: {const items = [1, 2, 3]} => the branch leaf carries the welded const length', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.branches).map((branch) => branch.condition)).toStrictEqual([
      {
        kind: 'leaf',
        id: `${BRANCH}#leaf`,
        operandParamName: 'items',
        operandConstLength: 3,
        operandType: { kind: 'array', element: { kind: 'number' } },
        predicate: { kind: 'length-gt', literal: 2 },
      },
    ]);
  });

  // NOT undriven and NOT a dark spot: the walk read the `if` and both arms perfectly, and the analyzer
  // resolved which arm is live. No OBJECT shape is declared. The dead arm rides the LINT channel.
  it('VALID: {a welded const array module} => nothing is admitted as undriven or a dark spot, and no declared types', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect({ undriven: analysis.undriven, darkSpots: analysis.darkSpots, declaredTypes: analysis.declaredTypes }).toStrictEqual({
      undriven: [],
      darkSpots: [],
      declaredTypes: [],
    });
  });
});
