import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'typeof-narrow-opaque.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/typeof-narrow-opaque/typeof-narrow-opaque.ts';

// The reason the analysis carries, verbatim. Pinned HERE rather than left to the transformer's own
// unit test because that test authors the sentence it then asserts; this one reads what the analyzer
// actually said about a real file, which is the only way the two can disagree.
const BRANCH_REASON =
  '`checkKind` has a branch on line 6 whose deciding value is a `typeof` read, so no case can steer ' +
  'which arm runs: with nothing to vary, both arms would arrange the same inputs and one would fail ' +
  "against correct code. Assayer understood the branch — this is not syntax it missed — but the value " +
  "`typeof` applies to is neither one of this entry's parameters nor an environment variable, so " +
  'Assayer cannot yet ask what the comparison narrows. Make that value a parameter and each arm ' +
  'becomes a case Assayer drives.';

describe(
  "undriven / typeof-narrow-opaque — `typeof readValue() === 'string'`, typeof's OWN operand is opaque",
  () => {
    // `readValue()` is a call, not a parameter — `typeof` is read past its own keyword to the call
    // itself, so this is the SAME opaque-operand limit `opaque-if` has, worded to say the value
    // `typeof` reads is what has no input, not that `typeof` is unreadable. `checkKind` takes no
    // parameters at all, so there is nothing this comparison could ever narrow by.
    it('VALID: {typeof of a call result} => the branch admitted undriven, naming the opaque-operand limit', () => {
      const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

      expect(analysis.undriven).toStrictEqual([{ name: 'checkKind', reason: BRANCH_REASON, startLine: 6, endLine: 6 }]);
    });

    it('VALID: {a typeof read of an opaque call} => no case is derived, so nothing fails against correct code', () => {
      const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

      expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([]);
    });

    // NOT a dark spot: the walk read the `if`, both arms, and the `typeof` operand's own call. Only the
    // decomposition into a per-arm value is beyond it, and here there is no parameter to decompose it
    // onto in the first place.
    it('VALID: {a fully-read if} => admits nothing as a dark spot', () => {
      const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

      expect(analysis.darkSpots).toStrictEqual([]);
    });

    // `readValue` is a branchless private nothing else calls it FOR — its own body has no branch, and
    // `checkKind`'s guard is what carries the branch — so it projects no entry of its own and is not
    // dead surface either: `checkKind` reaches it.
    it('VALID: {readValue, a branchless private} => the file has exactly one entry', () => {
      const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

      expect(analysis.functions.map((fn) => fn.entry.name)).toStrictEqual(['checkKind']);
      expect(analysis.lints).toStrictEqual([]);
    });
  },
);
