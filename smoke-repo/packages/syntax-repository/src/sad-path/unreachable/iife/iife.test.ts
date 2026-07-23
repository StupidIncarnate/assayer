import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'iife.ts'), 'utf8');
const relPath = 'src/sad-path/unreachable/iife/iife.ts';

// The arrow's scope segment is its full STRUCTURAL projection (an anonymous function has no name), held
// in a const and composed so an id moves only when the logic moves, never for its spelling.
const ARROW =
  'fn:ArrowFunction,Parameter,id:n,NumberKeyword,StringKeyword,EqualsGreaterThanToken,Block,IfStatement,BinaryExpression,id:n,GreaterThanToken,num:5,Block,ReturnStatement,str:big,ReturnStatement,str:small';
const THEN = `*module*/${ARROW}/return@if:BinaryExpression,id:n,GreaterThanToken,num:5#then`;

// The lint, verbatim — the module-load twin of welded-const, welded in the INVOCATION rather than the
// scope's own source. `n` is welded to `7` by `(…)(7)`, so `n > 5` on line 2 always wins and the
// `return 'small'` on line 6 is dead. The message names the operand and its welded value and reads by
// the file's LABEL; it keys under `*module*` because the IIFE runs at module load, exactly as the
// scope's own welded const does.
const UNREACHABLE_MESSAGE =
  '`iife.ts` can never reach the exit on line 6: `n` is welded to `7`, so the branch on line 2 always ' +
  'takes its other arm and this one is dead. Either a comparison is wrong, or this arm should be deleted.';

describe('unreachable / iife — an immediately-invoked function expression applied to a welded literal', () => {
  // The IIFE runs at module load, so the analyzer EVALUATES its welded argument rather than shrugging:
  // `n` is `7`, so the `if` arm is a real case (importing the module runs it and reaches that exit,
  // arranging nothing — the welded value is fixed in the source, not a settable input) and the fall-
  // through `return 'small'` is dead code on the lint channel. The entry's ACCESS is `module` (the
  // surface renders it by the file's label); it is NO LONGER admitted undriven — the module-load twin of
  // welded-arg's flip.
  it('VALID: {((n) => { if (n > 5) … })(7)} => the live arm is a module-driven case, the dead arm an unreachable-exit lint', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect({
      functions: analysis.functions.map((fn) => ({ access: fn.entry.access, cases: fn.cases })),
      lints: analysis.lints.map((lint) => ({ rule: String(lint.rule), name: String(lint.name), message: String(lint.message), startLine: lint.startLine })),
    }).toStrictEqual({
      functions: [{ access: { kind: 'module' }, cases: [{ reachesExit: THEN, arrange: [], salient: true }] }],
      lints: [{ rule: 'unreachable-exit', name: '*module*', message: UNREACHABLE_MESSAGE, startLine: 6 }],
    });
  });

  // NOT undriven and NOT a dark spot: the walk read the arrow and both arms perfectly, and the analyzer
  // resolved which arm the welded argument runs. The dead arm rides the LINT channel — the repo's debt —
  // not any of the "Assayer cannot drive this" admissions.
  it('VALID: {a welded-argument IIFE} => nothing is admitted as undriven or a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect({ undriven: analysis.undriven, darkSpots: analysis.darkSpots }).toStrictEqual({ undriven: [], darkSpots: [] });
  });
});
