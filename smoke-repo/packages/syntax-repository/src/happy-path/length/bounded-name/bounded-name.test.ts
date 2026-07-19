import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'bounded-name.ts'), 'utf8');
const relPath = 'src/happy-path/length/bounded-name/bounded-name.ts';
const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });
const tier = analysis.functions[0];

describe('length / bounded-name — two length comparisons on one operand, jointly satisfiable', () => {
  // Every comparison operator exists on the length axis, so a threshold is carried the same way a
  // numeric one is. `>= 2` and `<= 5` are ordinary comparisons that happen to be about a count — the
  // two against zero are not a separate species, and nothing here is `unrecognized`.
  it('VALID: {.length >= 2 && .length <= 5} => length predicates carrying their thresholds', () => {
    expect(tier.branches[0].condition).toStrictEqual(
      expect.objectContaining({
        kind: 'and',
        left: expect.objectContaining({ predicate: { kind: 'length-gte', literal: 2 } }),
        right: expect.objectContaining({ predicate: { kind: 'length-lte', literal: 5 } }),
      }),
    );
  });

  // THE PAYOFF. `'short'` needs a string that is at least two AND at most five characters — one value
  // satisfying both guards, not one per guard. Realizing each comparison into a string as it is read
  // would sample it, and the two samples would share no member exactly as two numeric samples did.
  //
  // The else-arm fans out per REASON the condition was false: too short (''), or long enough but over
  // the ceiling ('aaaaaa'). They are different flows and cannot share a case.
  it('VALID: {an operand bounded from both sides} => one string satisfying both bounds', () => {
    expect(tier.cases.map((testCase) => testCase.arrange)).toStrictEqual([
      [{ kind: 'param', param: 'name', value: 'aa' }],
      [{ kind: 'param', param: 'name', value: '' }],
      [{ kind: 'param', param: 'name', value: 'aaaaaa' }],
    ]);
  });

  // The NEGATIVE half of the length rung, and the failure worth catching here rather than in a
  // consumer's repo: two length guards that overlap must never be reported as contradicting. A false
  // "unreachable" tells a reader to delete working code, which is worse than saying nothing at all.
  it('VALID: {compatible length guards} => no dark spot, no admission, and NO unreachable-exit lint', () => {
    expect({ darkSpots: analysis.darkSpots, undriven: analysis.undriven, lints: analysis.lints }).toStrictEqual({
      darkSpots: [],
      undriven: [],
      lints: [],
    });
  });
});
