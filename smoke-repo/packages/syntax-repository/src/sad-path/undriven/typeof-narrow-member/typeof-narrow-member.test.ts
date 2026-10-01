import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'typeof-narrow-member.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/typeof-narrow-member/typeof-narrow-member.ts';

// The reason the analysis carries, verbatim. Pinned HERE rather than left to the transformer's own
// unit test because that test authors the sentence it then asserts; this one reads what the analyzer
// actually said about a real file, which is the only way the two can disagree.
const BRANCH_REASON =
  '`choose` has a branch on line 5 that reads `typeof target`, so no case can steer which arm runs: ' +
  'with nothing to vary, both arms would arrange the same inputs and one would fail against correct ' +
  'code. Assayer understood the branch and read the comparison: it narrows `target` to the union ' +
  'member whose runtime type matches on one arm and to the rest on the other. On at least one side, ' +
  'every matching member is a shape Assayer cannot yet select on its own from a union with more than ' +
  'one member — building the object or array is not the gap, choosing WHICH member to build is. There ' +
  'is no repo change that closes this today; it is a followup capability.';

describe(
  "undriven / typeof-narrow-member — `typeof target === 'string'` narrows a union, but one side is a shape",
  () => {
    // `target` IS the entry's own parameter, and the comparison DOES narrow it — the `string` member
    // answers the then arm. What blocks the branch is the else arm: `Plain` is the only member whose
    // tag is NOT `'string'`, and Assayer cannot yet pick a specific member of a union to build a value
    // from — only the union's first fillable member, which is what an UNCONSTRAINED parameter gets, not
    // what one particular arm of one particular branch needs.
    it('VALID: {a typeof narrowing a union with a non-scalar member} => the branch admitted undriven, naming the shape limit', () => {
      const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

      expect(analysis.undriven).toStrictEqual([{ name: 'choose', reason: BRANCH_REASON, startLine: 5, endLine: 5 }]);
    });

    // No case is derived, so nothing fails against correct code — the same safety property every
    // undriven admission carries.
    it('VALID: {a typeof-narrowed comparison Assayer cannot fully realize} => no case is derived', () => {
      const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

      expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([]);
    });

    // NOT a dark spot: the walk read the ternary, both arms, and target's full union descriptor —
    // string beside Plain, neither collapsed to unknown. Only the per-arm VALUE for the shape side is
    // beyond it.
    it('VALID: {a fully-read ternary} => admits nothing as a dark spot', () => {
      const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

      expect(analysis.darkSpots).toStrictEqual([]);
    });

    // The union keeps BOTH members — degrading to `unknown` on the object member would refuse the
    // whole parameter for the half nothing can build, and there is nothing here that cannot be built,
    // only a per-arm CHOICE that cannot yet be made.
    it('VALID: {target: Plain | string} => a union descriptor carrying the object beside the string', () => {
      const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

      expect(analysis.functions.flatMap((fn) => fn.entry.params)).toStrictEqual([
        {
          name: 'target',
          declaredText: 'Plain | string',
          type: {
            kind: 'union',
            members: [
              { kind: 'string' },
              { kind: 'object', typeName: 'Plain', properties: [{ name: 'label', type: { kind: 'string' } }] },
            ],
          },
        },
      ]);
    });
  },
);
