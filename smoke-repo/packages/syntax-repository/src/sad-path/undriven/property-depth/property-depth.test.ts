import { readFileSync } from 'fs';
import { join, resolve } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { stubRealizeBroker } from '@assayer/core/stub-realize';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'property-depth.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/property-depth/property-depth.ts';
// The syntax-repository package root, so stub-realize resolves against the same layout a real run does.
const root = resolve(__dirname, '..', '..', '..', '..');

// The reason the analysis carries, verbatim. Pinned HERE rather than left to the transformer's own
// unit test because that test authors the sentence it then asserts; this one reads what the analyzer
// actually said about a real file, which is the only way the two can disagree.
const BRANCH_REASON =
  '`checkDeep` has a branch on line 6 whose deciding value `config.db.retry` reads a property more ' +
  'than one level deep off one of its parameters, so no case can steer which arm runs: with nothing to ' +
  'vary, both arms would arrange the same inputs and one would fail against correct code. Assayer ' +
  'understood the branch — this is not syntax it missed — but it matches an object-member comparison ' +
  'only ONE property level deep (`config.mode`), never a path this long.';

describe('undriven / property-depth — `config.db.retry`, a property path more than one segment deep', () => {
  // `config` IS one of the entry's own parameters and the walk reads straight through to `retry` — the
  // leaf names the FULL path, never the bare root, which already is a parameter and would misread.
  it('VALID: {a two-segment property path} => the branch admitted undriven, naming the depth limit, never "make it a parameter"', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.undriven).toStrictEqual([{ name: 'checkDeep', reason: BRANCH_REASON, startLine: 6, endLine: 6 }]);
  });

  // NOT the one-segment `object / branch-local` shape: `object-arrange` only matches a property path
  // exactly one segment deep, so this branch stays undriven even THROUGH the consume-time overlay that
  // closes `config.mode`-shaped branches — the depth is a permanent limit today, not a per-file artifact.
  it('VALID: {stub-realize over the object param} => still no case, still undriven — depth, not consume timing', () => {
    const walked = tsMorphWalkFileAdapter({ source, relPath });
    const analysis = stubRealizeBroker({ analysis: analyzeFileBroker({ walked, relPath }), walked, root, relPath, overlays: [] });

    expect({
      cases: analysis.functions.flatMap((fn) => fn.cases),
      undriven: analysis.undriven,
    }).toStrictEqual({
      cases: [],
      undriven: [{ name: 'checkDeep', reason: BRANCH_REASON, startLine: 6, endLine: 6 }],
    });
  });

  // NOT a dark spot: the walk read the `if`, both arms, the property chain and the leaf property's own
  // type (`number`). Only the DEPTH of the object-member match is beyond it.
  it('VALID: {a fully-read if} => admits nothing as a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.darkSpots).toStrictEqual([]);
  });
});
