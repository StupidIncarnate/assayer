import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'private-function.ts'), 'utf8');
const relPath = 'src/undriven/private-function.ts';

// The reason the analysis carries, verbatim — and pointedly NOT the one `welded-operand.ts` carries.
// Both files are undriven; only this one names a feature that would close it, because only this one
// has anything to close. Merging the two sentences destroys the single thing they say.
const PRIVATE_REASON =
  'it is not exported, so nothing outside the module can call it and no case drove its branches. No ' +
  'harness closes this — driving a private directly is not a test anyone wants, and covering it THROUGH ' +
  'the callers that do reach it needs call-graph following, which Assayer does not do yet.';

describe('undriven / private-function — a helper reachable only through the caller that consumes it', () => {
  // THE admission, and the only reason this file exists. `decide` holds real branching that no case
  // reaches: nothing outside the module can call it, and the one thing that can — `report` — is
  // followed by nobody. The reason names call-graph following, so it must never read as permanent.
  it('VALID: {an unexported helper with a branch} => admitted as undriven, naming the feature that would close it', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.undriven).toStrictEqual([
      { name: 'decide', reason: PRIVATE_REASON, startLine: 1, endLine: 7 },
    ]);
  });

  // `decide` is walked but never PROJECTED: driving a private directly is not a test anyone wants, so
  // it is not an entry. That is the right call — and saying nothing about it was the bug the admission
  // above fixes. An analysis reporting one entry, zero branches and zero dark spots reads as a file
  // fully understood, which it is, and fully COVERED, which it is not.
  it('VALID: {an unexported helper} => is not an entry; only the exported caller is', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access }))).toStrictEqual([
      { name: 'report', access: { kind: 'named' } },
    ]);
  });

  // The admission never costs the file its real coverage: `report` is exported, so it is driven like
  // any other entry and keeps its case. An undriven entry beside a driven one is the shape that proves
  // the narrowing is per-ENTRY and not per-file.
  it('VALID: {the exported caller} => is driven with a real arrange, undimmed by the admission beside it', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesExit: '*module*/report/return@top', arrange: [{ kind: 'param', param: 'value', value: 0 }] },
    ]);
  });

  // NOT a dark spot, and the distinction is the whole point of having two words: the walk read
  // `decide` and its `if` perfectly. Nothing is blind here — the runner simply cannot call a private.
  it('VALID: {a fully-understood private} => admits nothing as a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.darkSpots).toStrictEqual([]);
  });
});
