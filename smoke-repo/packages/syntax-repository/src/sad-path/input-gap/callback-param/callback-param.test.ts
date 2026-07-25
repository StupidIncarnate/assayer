import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'callback-param.ts'), 'utf8');
const relPath = 'src/sad-path/input-gap/callback-param/callback-param.ts';

// The invoice VERBATIM. It is product surface (P1): an LLM reads exactly these bytes and closes the gap
// from them alone, so it names the entry, the parameter, the type the checker renders, why no value can
// be derived, and the harness that supplies one.
const GAP_REASON =
  '`audit` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
  'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
  'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
  'its name: `report: (message: string) => string`. Substituting a stand-in would be worse than ' +
  'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes ' +
  'on something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed ' +
  "— so the value is the caller's to supply. Colocate a harness with this file, the same basename " +
  "with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
  'assayerHarness({ inputs: { audit: { report: <a (message: string) => string> } } });`. Assayer then ' +
  'builds them from that declaration instead of refusing them; anything else still standing between ' +
  '`audit` and a case is reported on its own line.';

describe('input-gap / callback-param — a CALLBACK parameter is UNFILLABLE, so the entry derives no case', () => {
  // Ordinary code: a function taking a reporter. The branch on `size` is steered normally and both arms
  // would derive sound cases — but `report` is a callable, and no value in the arrange vocabulary is a
  // function. The fill seam REFUSES it, and a refused parameter drops the whole entry's case set rather
  // than handing `report('over')` a string that throws.
  //
  // A RATCHET on the caller's side: a harness supplying the callback is what closes this, and the day
  // one can the entry becomes drivable and this file MOVES to happy-path.
  it('VALID: {an unsteered callback param} => the entry derives no case at all', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases }))).toStrictEqual([
      { name: 'audit', access: { kind: 'named' }, cases: [] },
    ]);
  });

  // The sharp end: the refusal has a VOICE. The gap rides the ANALYSIS, so the file admits it the
  // moment it is opened — before any run — and the invoice names the parameter, its declared type, and
  // the harness that closes it.
  it('VALID: {a refused parameter} => a GAP on the analysis, invoicing the parameter and its remedy', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.gaps).toStrictEqual([{ name: 'audit', reason: GAP_REASON }]);
  });

  // A GAP and never one of the other three. The branch on `size` is steered perfectly, the syntax is
  // ordinary, and the code is correct — so nothing is undriven, nothing is dark, and nothing is linted.
  // Merging any of them here would tell the reader to fix code that has nothing wrong with it.
  it('VALID: {a refused parameter} => the debt is the caller\'s alone, on no other channel', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect({
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
    }).toStrictEqual({ undriven: [], darkSpots: [], lints: [] });
  });
});
