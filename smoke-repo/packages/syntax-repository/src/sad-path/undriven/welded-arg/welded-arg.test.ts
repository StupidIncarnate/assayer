import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'welded-arg.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/welded-arg/welded-arg.ts';

// The reason the analysis carries, verbatim. `decide` is REACHED — `report` calls it — so it is not
// dead surface; but the call welds a literal `3`, so the `> 5` arm is unreachable through its only
// caller and no case can steer it. A PERMANENT dead end: no feature inverts a source-welded constant,
// so this stays undriven even when the plan is fully adopted. Distinct from undriven/welded-const:
// there the welded value is a module const, here it is a call argument.
const FIXED_ARG_REASON =
  'it is reached only through arguments fixed in the source, so no case can steer it to another ' +
  'branch: a caller welds a value into the call, and a branch with one possible outcome is decided ' +
  'there, not at run time. No harness closes this — a caller that passed its own input straight ' +
  'through instead would make each arm a case that sets it, and Assayer would drive it.';

describe('undriven / welded-arg — a private reached only through a welded literal argument', () => {
  it('VALID: {a private reached through a fixed argument} => admitted as undriven, naming what would drive it', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.undriven).toStrictEqual([{ name: 'decide', reason: FIXED_ARG_REASON, startLine: 1, endLine: 7 }]);
  });

  // `decide` is not an entry: it is not exported and no passthrough caller drives it, so only the
  // exported `report` is projected — undimmed by the admission beside it.
  it('VALID: {a fixed-arg private} => is not an entry; only the exported caller is, and it is driven', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases }))).toStrictEqual([
      {
        name: 'report',
        access: { kind: 'named' },
        cases: [{ reachesExit: '*module*/report/return@top', arrange: [{ kind: 'param', param: 'value', value: 0 }] }],
      },
    ]);
  });

  // NOT a dark spot: the walk read `decide` and its `if` perfectly. Nothing is blind here — the arm is
  // simply unreachable as this file consumes it.
  it('VALID: {a fully-understood private} => admits nothing as a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.darkSpots).toStrictEqual([]);
  });
});
