import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'needs-ctor-arg.ts'), 'utf8');
const relPath = 'src/sad-path/run-gap/needs-ctor-arg/needs-ctor-arg.ts';

describe('run-gap / needs-ctor-arg — a class whose constructor needs arguments makes its members a RUN GAP', () => {
  // This is the RUN GAP rung: `Repo`'s constructor takes a required `url`, so nothing can build an
  // instance to drive its method. `case-set-projection` turns both the constructor (reached through
  // `new`, which the runner never models) and the non-constructable `find` into named gaps — understood
  // perfectly, but the CALLER owes a harness before either can run. The file pairs them with a plain
  // driven `tally`, so the file still has a runnable entry (and a Run button) beside the two gaps: the
  // access kinds asserted here are exactly what `case-set-projection` reads to decide gap-vs-drivable.
  it('VALID: {exported fn + class needing ctor args} => a driven named entry beside a constructor and a NON-constructable method', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access }))).toStrictEqual([
      { name: 'tally', access: { kind: 'named' } },
      { name: 'constructor', access: { kind: 'constructor', className: 'Repo' } },
      { name: 'find', access: { kind: 'method', className: 'Repo', constructable: false } },
    ]);
  });

  // A gap is none of the other three admissions: it is not syntax Assayer failed to parse (dark spot),
  // not a scope out of the runner's reach (undriven), and not a repo pattern to change (lint). It lives
  // only in the RUNNABLE case set, which is why this file's analysis carries none of those channels.
  it('VALID: {the gap specimen} => no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({ darkSpots: analysis.darkSpots, undriven: analysis.undriven, lints: analysis.lints }).toStrictEqual({
      darkSpots: [],
      undriven: [],
      lints: [],
    });
  });
});
