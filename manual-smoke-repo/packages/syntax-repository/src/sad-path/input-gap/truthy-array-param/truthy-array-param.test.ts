import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'truthy-array-param.ts'), 'utf8');
const relPath = 'src/sad-path/input-gap/truthy-array-param/truthy-array-param.ts';

const BRANCH = '*module*/hasEntries/if:id:tags';
const THEN = `${BRANCH.replace('/if:', '/return@if:')}#then`;

// The truthy arm DOES derive (pinned above), so the opening clause says a case exists rather than
// "derives no case" — that would be false the moment the truthy arm's cases do.
const GAP_REASON =
  '`hasEntries` derives a case, but not every one it could: Assayer cannot construct an input it still ' +
  'needs. It builds inputs out of declared DATA — a scalar, a union, an array, or an object shape whose ' +
  'every property is itself one — and refuses anything that bottoms out in a function or in a type ' +
  'carrying nothing but its name: `tags: string[]`. Substituting a stand-in would be worse than ' +
  'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes on ' +
  "something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed — so " +
  "the value is the caller's to supply. Colocate a harness with this file, the same basename with a " +
  "`.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
  'assayerHarness({ inputs: { hasEntries: { tags: <a string[]> } } });`. Assayer then builds them from ' +
  'that declaration instead of refusing them; anything else still standing between `hasEntries` and a ' +
  'case is reported on its own line.';

describe('input-gap / truthy-array-param — a bare truthy read of an ARRAY param, the array twin of truthy-object-param', () => {
  // The truthy arm still fans out over cardinality — `array-arrange`'s empty/one/many, exactly as an
  // unconstrained array param does — because nothing about `if (tags)` alone narrows a LENGTH; every
  // array, regardless of size, is truthy.
  it('VALID: {if (tags)} => the truthy arm fans out over cardinality, empty/one/many', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'truthy-array-param.ts') }), relPath });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesPath: [THEN], arrange: [{ kind: 'array', param: 'tags', value: [] }], salient: true },
      { reachesPath: [THEN], arrange: [{ kind: 'array', param: 'tags', value: ['abc123'] }], salient: false },
      { reachesPath: [THEN], arrange: [{ kind: 'array', param: 'tags', value: ['abc123', 'abc123_1'] }], salient: false },
    ]);
  });

  // No array the seam builds is ever falsy, so the falsy arm's bucket refuses `tags` instead of handing
  // it the SAME empty array the truthy arm's `empty` cardinality already claims — the refusal is
  // invoiced as a GAP, never a silent duplicate of the `#then` case reaching the wrong exit.
  it('VALID: {if (tags)} => the falsy arm is refused and invoiced as a GAP naming `tags`', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'truthy-array-param.ts') }), relPath });

    expect(analysis.gaps).toStrictEqual([{ name: 'hasEntries', reason: GAP_REASON }]);
  });

  it('VALID: {a truthy array param} => the gap rides no other channel: no dark spot, no undriven, no lint', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'truthy-array-param.ts') }), relPath });

    expect({ darkSpots: analysis.darkSpots, undriven: analysis.undriven, lints: analysis.lints }).toStrictEqual({
      darkSpots: [],
      undriven: [],
      lints: [],
    });
  });
});
