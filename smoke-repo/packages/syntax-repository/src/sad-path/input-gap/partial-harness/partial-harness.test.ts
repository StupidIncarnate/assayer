import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { harnessRealizeBroker } from '@assayer/core/harness-realize';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'partial-harness.ts'), 'utf8');
const relPath = 'src/sad-path/input-gap/partial-harness/partial-harness.ts';
const root = join(__dirname, '..', '..', '..', '..');

// The FIRST invoice, before any harness exists: two refused parameters on one line, in signature order,
// and both in the pasteable snippet.
const BOTH_REFUSED =
  '`record` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
  'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
  'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
  'its name: `log: (message: string) => string`, `sink: (line: string) => string`. Substituting a ' +
  'stand-in would be worse than ' +
  'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes ' +
  'on something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed ' +
  "— so the value is the caller's to supply. Colocate a harness with this file, the same basename " +
  "with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
  'assayerHarness({ inputs: { record: { log: <a (message: string) => string>, ' +
  'sink: <a (line: string) => string> } } });`. Assayer then ' +
  'builds them from that declaration instead of refusing them; anything else still standing between ' +
  '`record` and a case is reported on its own line.';

// The RE-invoice, with `log` supplied and `sink` still missing. Byte-identical to the first except that
// `log` is gone from both the refusal list and the snippet. That difference is the whole specimen.
const SINK_ONLY =
  '`record` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
  'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
  'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
  'its name: `sink: (line: string) => string`. Substituting a stand-in would be worse than ' +
  'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes ' +
  'on something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed ' +
  "— so the value is the caller's to supply. Colocate a harness with this file, the same basename " +
  "with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
  'assayerHarness({ inputs: { record: { sink: <a (line: string) => string> } } });`. Assayer then ' +
  'builds them from that declaration instead of refusing them; anything else still standing between ' +
  '`record` and a case is reported on its own line.';

describe('input-gap / partial-harness — supplying SOME of what was refused keeps the gap, re-worded', () => {
  // Where the reader starts: two callables, both refused, both named.
  it('VALID: {the per-file analysis alone} => the invoice names BOTH refused parameters', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'partial-harness.ts') }), relPath });

    expect(analysis.gaps).toStrictEqual([{ name: 'record', reason: BOTH_REFUSED }]);
  });

  // The point of the specimen. The colocated harness declares `log` and stops there, so `record` still
  // cannot be called and still derives nothing — but the invoice is REBUILT from the refusals that
  // remain. Reprinting the original would bill the reader for the input they just handed over, which is
  // the one thing a partial payment must not do.
  it('VALID: {a harness declaring only `log`} => still no case, and the invoice names only `sink`', () => {
    const walked = walkFileTransformer({ source, relPath, absPath: join(__dirname, 'partial-harness.ts') });
    const analysis = harnessRealizeBroker({ analysis: analyzeFileBroker({ walked, relPath }), root, relPath });

    expect({
      cases: analysis.functions.flatMap((fn) => fn.cases),
      gaps: analysis.gaps,
    }).toStrictEqual({ cases: [], gaps: [{ name: 'record', reason: SINK_ONLY }] });
  });

  // Still a GAP, still the caller's, still on no other channel. A partial payment moves the wording and
  // nothing else — it must not degrade into an undriven admission or a lint about correct code.
  it("VALID: {a harness declaring only `log`} => the debt stays the caller's, on no other channel", () => {
    const walked = walkFileTransformer({ source, relPath, absPath: join(__dirname, 'partial-harness.ts') });
    const analysis = harnessRealizeBroker({ analysis: analyzeFileBroker({ walked, relPath }), root, relPath });

    expect({
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
    }).toStrictEqual({ undriven: [], darkSpots: [], lints: [] });
  });
});
