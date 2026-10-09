import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'needs-ctor-arg.ts'), 'utf8');
const relPath = 'src/happy-path/class/needs-ctor-arg/needs-ctor-arg.ts';

describe('class / needs-ctor-arg — a class whose constructor needs a buildable argument has its instance method driven', () => {
  // `Repo`'s constructor takes a required `url: string`, which Assayer builds from its declared type like
  // any parameter. The run builds each instance of `Repo` with that argument, so `find` is driven. The
  // constructor is driven too: the runner constructs `Repo` with the `url` its case arranges. The file
  // pairs them with a plain driven `tally`. `find` is `constructable: false` because its class cannot be
  // built with no arguments, and the case-set projection reads that fact to decide how to build it.
  it('VALID: {exported fn + class needing ctor args} => a driven named entry beside a constructor and a NON-constructable method', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'needs-ctor-arg.ts') }) });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access }))).toStrictEqual([
      { name: 'tally', access: { kind: 'named' } },
      { name: 'constructor', access: { kind: 'constructor', className: 'Repo' } },
      { name: 'find', access: { kind: 'method', className: 'Repo', constructable: false } },
    ]);
  });

  // Nothing is admitted: every argument the instance needs is a scalar Assayer builds itself, so the run
  // has no gap, no undriven entry and no lint to report either.
  it('VALID: {the specimen} => no gaps, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'needs-ctor-arg.ts') }) });

    expect({ gaps: analysis.gaps, darkSpots: analysis.darkSpots, undriven: analysis.undriven, lints: analysis.lints }).toStrictEqual({
      gaps: [],
      darkSpots: [],
      undriven: [],
      lints: [],
    });
  });
});
