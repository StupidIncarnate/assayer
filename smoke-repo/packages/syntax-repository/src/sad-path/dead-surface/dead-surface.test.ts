import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'dead-surface.ts'), 'utf8');
const relPath = 'src/sad-path/dead-surface/dead-surface.ts';

// The message the analysis carries, verbatim. `unused` is a private with real branching that NOTHING
// in the file calls — and an unexported symbol is reachable only from its own file, so nothing ever
// will. A PERMANENT dead end: no feature closes it; only the repo deleting or wiring up the code does,
// so a fully-adopted plan still flags it. That is dead code — the repo's debt, on the lint channel.
const DEAD_SURFACE_MESSAGE =
  'nothing in this file calls it, so it is dead surface: an unexported helper is reachable only from ' +
  'its own file, and nothing here reaches it. Delete it, or consume it from a caller that passes an ' +
  'input straight through — which the follower would then drive.';

describe('dead-surface — an unexported helper nothing consumes', () => {
  // THE lint. It rides a DIFFERENT channel from undriven: this says "change the code", not "Assayer
  // cannot drive it". Reached-by-nobody is what separates it from undriven/welded-arg, where a caller
  // does reach the private but welds its argument.
  it('VALID: {an unexported helper reached by nobody} => emitted as a dead-surface lint', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.lints).toStrictEqual([
      { rule: 'dead-surface', name: 'unused', message: DEAD_SURFACE_MESSAGE, startLine: 1, endLine: 7 },
    ]);
  });

  // The lint is not an undriven admission and not a dark spot: the walk read `unused` fine, and no
  // caller reaches it, so neither of those channels may hold it. Only the exported `greet` is driven.
  it('VALID: {dead surface beside real code} => nothing undriven, nothing dark, greet still driven', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      entries: analysis.functions.map((fn) => String(fn.entry.name)),
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
    }).toStrictEqual({ entries: ['greet'], undriven: [], darkSpots: [] });
  });
});
