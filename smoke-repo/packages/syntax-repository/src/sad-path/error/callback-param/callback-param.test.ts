import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'callback-param.ts'), 'utf8');
const relPath = 'src/sad-path/error/callback-param/callback-param.ts';

const THEN = '*module*/audit/return@if:BinaryExpression,id:size,GreaterThanToken,num:10#then';
const ELSE = '*module*/audit/return@if:BinaryExpression,id:size,GreaterThanToken,num:10#else';

// The fill under test. `report` is a CALLBACK the case does not steer, so it is filled — and the fill
// hands it the scalar string placeholder, which the entry then tries to CALL. `fill-param` branches on
// the parameter kind and has an arm for arrays and one for scalars; a callable falls to the scalar arm.
const REPORT_FILL = { kind: 'param', param: 'report', value: 'abc123' };

describe('error / callback-param — an unsteered CALLBACK parameter is filled with a scalar string, so calling it throws', () => {
  // Ordinary code: a function taking a reporter. Nothing here is contrived to fail — the branch on
  // `size` is steered normally and both arms derive sound cases. The DEFECT is the sibling fill: the
  // derivation hands `report` the string `'abc123'`, and `report('over')` cannot be called on a string.
  //
  // A RATCHET, and the reason this specimen is in sad-path/error rather than happy-path: the code is
  // correct, so the day `fill-param` learns to fill a callable (a no-op function of the declared return
  // type) both cases pass and this file MOVES to happy-path. Until then it is an honest record that
  // Assayer errors on a shape any repo contains.
  it('VALID: {an unsteered callback param} => filled with the scalar placeholder, which is not callable', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases }))).toStrictEqual([
      {
        name: 'audit',
        access: { kind: 'named' },
        cases: [
          {
            reachesPath: [THEN],
            arrange: [{ kind: 'param', param: 'size', value: 11 }, REPORT_FILL],
            salient: true,
          },
          {
            reachesPath: [ELSE],
            arrange: [{ kind: 'param', param: 'size', value: 10 }, REPORT_FILL],
            salient: true,
          },
        ],
      },
    ]);
  });

  // Nothing is ADMITTED, and that is the sharp end of this specimen. Assayer does not say it failed to
  // understand the file, could not drive it, or wants a harness — it reports two confident cases and
  // then throws on both. An admission would at least be honest; a wrong INPUT is the one failure mode
  // the four admission channels cannot express, which is why it can only surface as a run ERROR.
  it('VALID: {a file Assayer drives with an unusable value} => no gap, dark spot, undriven or lint to warn of it', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect({
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
    }).toStrictEqual({ undriven: [], darkSpots: [], lints: [] });
  });
});
