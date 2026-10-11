import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const relPath = 'src/happy-path/routes/side-effect-if/side-effect-if.ts';
const absPath = join(__dirname, 'side-effect-if.ts');
const source = readFileSync(absPath, 'utf8');

describe('routes / side-effect-if — an if whose arm only fires a side effect', () => {
  // An arm counts whether it returns, fires a side effect, or does nothing. `if (flag) doThing()` has two
  // arms: the body runs, or it does not. So it is two routes, two cases, and both run.
  it('VALID: {if (flag) doThing()} => two cases, one per arm, and both are in the fewest-runs set', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath }), relPath });
    const [entry] = analysis.functions;

    expect(
      (entry?.cases ?? []).map((testCase) => ({
        flag: testCase.arrange[0]?.kind === 'param' ? testCase.arrange[0].value : undefined,
        arms: testCase.arms.map((step) => step.arm),
        driven: testCase.driven,
        fewestRuns: testCase.fewestRuns,
      })),
    ).toStrictEqual([
      { flag: true, arms: ['then'], driven: true, fewestRuns: true },
      { flag: false, arms: ['else'], driven: true, fewestRuns: true },
    ]);
  });

  it('VALID: {the side-effect call} => nothing is admitted', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath }), relPath });

    expect({ undriven: analysis.undriven, lints: analysis.lints, gaps: analysis.gaps, darkSpots: analysis.darkSpots }).toStrictEqual({
      undriven: [],
      lints: [],
      gaps: [],
      darkSpots: [],
    });
  });
});
