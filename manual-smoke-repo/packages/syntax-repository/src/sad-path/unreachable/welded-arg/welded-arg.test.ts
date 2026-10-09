import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'welded-arg.ts'), 'utf8');
const relPath = 'src/sad-path/unreachable/welded-arg/welded-arg.ts';

// `decide`'s live exit, keyed on its branch, and `report`'s own return. `report` welds `3` into
// `decide(3)`, so `value` can only be `3`; `3 > 5` is false, so the `else` arm is the exit the one
// funnel case reaches, then `report` returns through it.
const DECIDE_ELSE = '*module*/decide/return@if:BinaryExpression,id:value,GreaterThanToken,num:5#else';
const REPORT_RETURN = '*module*/report/return@top';

// The lint the analysis carries, verbatim. `report` welds `3` into `decide(3)`, so `decide`'s `value`
// can only be `3`; `3 > 5` is false, so the `then` arm on line 3 is dead. The message names the operand
// and its welded value — the funnel twin of unreachable/welded-const, where the value is welded in the
// scope's OWN source rather than in a surface's call argument.
const UNREACHABLE_MESSAGE =
  '`decide` can never reach the exit on line 3: `value` is welded to `3`, so the branch on line 2 ' +
  'always takes its other arm and this one is dead. Either a comparison is wrong, or this arm should ' +
  'be deleted.';

describe('unreachable / welded-arg — a private whose branch a surface welds a literal argument into', () => {
  // The payoff: following the welded call FUNNELS `decide` into `report` and EVALUATES it. `report`'s
  // only exit is `return decide(3)`, so `decide` cannot be reached without calling `report`: `report` is
  // the SOLE entry, with ONE funnel case — the live `else` arm — arranging nothing, since the welded `3`
  // is baked into `report`'s body, not a settable input. No separate `decide` entry.
  it('VALID: {report returns decide(3)} => report is the sole entry with one live-arm funnel case', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'welded-arg.ts') }), relPath });

    expect(analysis.functions.map((fn) => ({ name: String(fn.entry.name), access: fn.entry.access, cases: fn.cases }))).toStrictEqual([
      {
        name: 'report',
        access: { kind: 'named' },
        cases: [{ reachesPath: [DECIDE_ELSE, REPORT_RETURN], arrange: [], salient: true }],
      },
    ]);
  });

  // The dead `then` arm rides the LINT channel — the repo's debt. The lint keys on the SURFACE that owns
  // it (`report`, the sole entry) while the message names where the dead code lives (`decide`, on its own
  // line), naming the operand and its welded value exactly as a welded-const scope's dead arm does.
  it('VALID: {the welded then-arm} => an unreachable-exit lint keyed to report, naming `value` welded to `3`', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'welded-arg.ts') }), relPath });

    expect(
      analysis.lints.map((lint) => ({
        rule: String(lint.rule),
        name: String(lint.name),
        message: String(lint.message),
        startLine: lint.startLine,
        endLine: lint.endLine,
      })),
    ).toStrictEqual([{ rule: 'unreachable-exit', name: 'report', message: UNREACHABLE_MESSAGE, startLine: 3, endLine: 3 }]);
  });

  // NO LONGER undriven and NOT a dark spot: the analyzer resolved which arm is live, so the file admits
  // nothing it cannot drive — its only debt is the repo's dead arm, on the lint channel.
  it('VALID: {a fully-evaluated welded-arg funnel} => admits nothing as undriven or a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'welded-arg.ts') }), relPath });

    expect({ undriven: analysis.undriven, darkSpots: analysis.darkSpots }).toStrictEqual({ undriven: [], darkSpots: [] });
  });
});
