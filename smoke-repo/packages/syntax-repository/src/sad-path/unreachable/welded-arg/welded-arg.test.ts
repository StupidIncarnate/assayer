import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'welded-arg.ts'), 'utf8');
const relPath = 'src/sad-path/unreachable/welded-arg/welded-arg.ts';

// `decide`'s branch, and the one live exit keyed on it. The welded call argument makes `value` a single
// value (`3`), so the `> 5` arm is dead and the fall-through is the exit every case reaches.
const BRANCH = '*module*/decide/if:BinaryExpression,id:value,GreaterThanToken,num:5';
const LIVE_ELSE = `${BRANCH.replace('/if:', '/return@if:')}#else`;

// The lint the analysis carries, verbatim. `report` welds `3` into `decide(3)`, so `decide`'s `value`
// can only be `3`; `3 > 5` is false, so the `then` arm on line 3 is dead. The message names the operand
// and its welded value — the through-caller twin of unreachable/welded-const, where the value is welded
// in the scope's OWN source rather than in a caller's argument.
const UNREACHABLE_MESSAGE =
  '`decide` can never reach the exit on line 3: `value` is welded to `3`, so the branch on line 2 ' +
  'always takes its other arm and this one is dead. Either a comparison is wrong, or this arm should ' +
  'be deleted.';

describe('unreachable / welded-arg — a private whose branch a caller welds a literal argument into', () => {
  // The payoff: following the welded call EVALUATES `decide` rather than admitting it undriven. `report`
  // is a driven named entry (its own `value` is unused, filled representatively), and `decide` is a
  // DRIVEN through-caller entry with ONE case — the live `else` arm. The welded `3` is baked into
  // `report`'s body, not a settable input, so `decide`'s case arranges `report`'s params representatively.
  it('VALID: {report calls decide(3)} => report is driven and decide is a driven through-caller entry with one live-arm case', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions.map((fn) => ({ name: String(fn.entry.name), access: fn.entry.access, cases: fn.cases }))).toStrictEqual([
      {
        name: 'report',
        access: { kind: 'named' },
        cases: [{ reachesExit: '*module*/report/return@top', arrange: [{ kind: 'param', param: 'value', value: 7 }], salient: true }],
      },
      {
        name: 'decide',
        access: { kind: 'through-caller', callerName: 'report' },
        cases: [{ reachesExit: LIVE_ELSE, arrange: [{ kind: 'param', param: 'value', value: 7 }], salient: true }],
      },
    ]);
  });

  // The dead `then` arm rides the LINT channel — the repo's debt — naming the operand and its welded
  // value, exactly as a welded-const scope's dead arm does.
  it('VALID: {the welded then-arm} => an unreachable-exit lint naming `value` welded to `3`', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(
      analysis.lints.map((lint) => ({
        rule: String(lint.rule),
        name: String(lint.name),
        message: String(lint.message),
        startLine: lint.startLine,
        endLine: lint.endLine,
      })),
    ).toStrictEqual([{ rule: 'unreachable-exit', name: 'decide', message: UNREACHABLE_MESSAGE, startLine: 3, endLine: 3 }]);
  });

  // NO LONGER undriven and NOT a dark spot: the analyzer resolved which arm is live, so the file admits
  // nothing it cannot drive — its only debt is the repo's dead arm, on the lint channel.
  it('VALID: {a fully-evaluated welded-arg private} => admits nothing as undriven or a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect({ undriven: analysis.undriven, darkSpots: analysis.darkSpots }).toStrictEqual({ undriven: [], darkSpots: [] });
  });
});
