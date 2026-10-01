import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'band-reading.ts'), 'utf8');
const relPath = 'src/happy-path/array/cross-file-map/band-reading.ts';

// The imported callee, analysed on its OWN — a plain 3-arm branching function driven by its scalar
// param `n`, exactly as any same-file `if`-else rung. This is the CHILD of cross-file-map/: its branches
// are what the parent's funnel folds, and its coverage ids (rooted at the sibling module scope and the
// callee name) are the ones the parent's folded paths thread through. Deliberately different thresholds
// (80 / 20) from map-conditional's callback (100 / 0), so the funnel is proven to read the callee's real
// predicate rather than a hardcoded shape.
const HIGH = 'if:BinaryExpression,id:n,GreaterThanEqualsToken,num:80';
const LOW = 'if:BinaryExpression,id:n,LessThanToken,num:20';
const HIGH_EXIT = `*module*/bandReading/return@${HIGH}#then`;
const LOW_EXIT = `*module*/bandReading/return@${HIGH}#else/${LOW}#then`;
const MID_EXIT = `*module*/bandReading/return@${HIGH}#else/${LOW}#else`;

describe('array / cross-file-map — band-reading, the imported callee driven as a plain 3-arm function', () => {
  it('VALID: {bandReading(n)} => three cases, one per band, each steered by an n its arm distinguishes', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect(
      analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases })),
    ).toStrictEqual([
      {
        name: 'bandReading',
        access: { kind: 'named' },
        cases: [
          { reachesPath: [HIGH_EXIT], arrange: [{ kind: 'param', param: 'n', value: 80 }], salient: true },
          { reachesPath: [LOW_EXIT], arrange: [{ kind: 'param', param: 'n', value: 19 }], salient: true },
          { reachesPath: [MID_EXIT], arrange: [{ kind: 'param', param: 'n', value: 79 }], salient: true },
        ],
      },
    ]);
  });

  it('VALID: {a plain branching function} => nothing admitted, a clean happy-path run', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect({
      lints: analysis.lints,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      declaredTypes: analysis.declaredTypes,
    }).toStrictEqual({ lints: [], undriven: [], darkSpots: [], declaredTypes: [] });
  });
});
