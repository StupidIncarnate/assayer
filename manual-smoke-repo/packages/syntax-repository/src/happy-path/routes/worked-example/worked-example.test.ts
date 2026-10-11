import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const relPath = 'src/happy-path/routes/worked-example/worked-example.ts';
const absPath = join(__dirname, 'worked-example.ts');
const source = readFileSync(absPath, 'utf8');

// The four branches, by the line they sit on: the ternary that picks `data`, the `=== 'None'` test, the
// `=== 'No'` test, and the `includes('on')` test.
const BRANCH_NAME_BY_LINE: Record<number, string> = {
  8: 'length',
  9: 'none',
  10: 'no',
  14: 'includes-on',
};

const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath }), relPath });
const [entry] = analysis.functions;
const lineByBranch = new Map((entry?.branches ?? []).map((branch) => [String(branch.coverageId), Number(branch.startLine)]));

// A case's arms in the spec's words: the ternary is `short` or `long`, every other test is `<name> true`
// or `<name> false`.
const armLabels = (arms: readonly { branchCoverageId: unknown; arm: unknown }[]): string[] =>
  arms.map((step) => {
    const name = BRANCH_NAME_BY_LINE[lineByBranch.get(String(step.branchCoverageId)) ?? 0];

    return name === 'length' ? (step.arm === 'then' ? 'short' : 'long') : `${String(name)} ${step.arm === 'then' ? 'true' : 'false'}`;
  });

// The arms the function really takes for one input, written out by hand from the source above and the spec
// table rather than read off the analysis: this is what "the arms its arranged input takes" means.
const armsTakenBy = (dataOuter: string): string[] => {
  const short = dataOuter.length < 5;
  const original = short ? dataOuter : 'NoneTon';
  const afterNone = original === 'None' ? original.slice(1, -1) : original;

  return [
    short ? 'short' : 'long',
    `none ${original === 'None' ? 'true' : 'false'}`,
    `no ${afterNone === 'No' ? 'true' : 'false'}`,
    `includes-on ${afterNone.includes('on') ? 'true' : 'false'}`,
  ];
};

const inputOf = (testCase: { arrange: readonly { kind: string; value?: unknown }[] }): string => String(testCase.arrange[0]?.value);

describe('routes / worked-example — four sequential branches, sixteen combinations, five routes', () => {
  // The four branches make 16 combinations of arms. Eleven contradict themselves: `data` cannot be both
  // `'None'` and `'No'`, `'None'` becomes `'on'` so it can neither equal `'No'` nor miss `'on'`, and a long
  // `dataOuter` makes `data` the constant `'NoneTon'`, which is neither `'None'` nor `'No'` and does
  // include `'on'`. Five routes remain, in this order.
  it('VALID: {the worked example} => exactly the five every-route cases, with the arms of the spec table', () => {
    const cases = (entry?.cases ?? []).map((testCase) => armLabels(testCase.arms));

    expect(cases).toStrictEqual([
      ['short', 'none true', 'no false', 'includes-on true'],
      ['short', 'none false', 'no true', 'includes-on false'],
      ['short', 'none false', 'no false', 'includes-on true'],
      ['short', 'none false', 'no false', 'includes-on false'],
      ['long', 'none false', 'no false', 'includes-on true'],
    ]);
  });

  it("VALID: {the first three routes} => the inputs the spec names, 'None', 'No' and 'on'", () => {
    const inputs = (entry?.cases ?? []).slice(0, 3).map((testCase) => inputOf(testCase));

    expect(inputs).toStrictEqual(['None', 'No', 'on']);
  });

  // Never label an arm first and then pick an input on its own: every case's arm labels are the arms its
  // arranged input takes when the function runs on it.
  it('VALID: {every case} => its arm labels are the arms its own arranged input takes', () => {
    const labelled = (entry?.cases ?? []).map((testCase) => ({ arms: armLabels(testCase.arms), taken: armsTakenBy(inputOf(testCase)) }));

    expect(labelled.filter(({ arms, taken }) => arms.join() !== taken.join())).toStrictEqual([]);
  });

  // Case 1 is the only route that takes `=== 'None'` true, case 2 the only one that takes `=== 'No'` true,
  // and case 5 the only one that takes the long arm. Together the three take all eight arms.
  it('VALID: {the fewest-runs set} => cases 1, 2 and 5', () => {
    const fewest = (entry?.cases ?? []).flatMap((testCase, index) => (testCase.fewestRuns ? [index + 1] : []));

    expect(fewest).toStrictEqual([1, 2, 5]);
  });

  it('VALID: {the fewest-runs set} => takes every one of the eight arms', () => {
    const taken = new Set((entry?.cases ?? []).filter((testCase) => testCase.fewestRuns).flatMap((testCase) => armLabels(testCase.arms)));

    expect([...taken].sort()).toStrictEqual(
      ['includes-on false', 'includes-on true', 'long', 'no false', 'no true', 'none false', 'none true', 'short'].sort(),
    );
  });

  it('VALID: {every route can run} => all five cases are driven and nothing is admitted', () => {
    expect({
      driven: (entry?.cases ?? []).map((testCase) => testCase.driven),
      undriven: analysis.undriven,
      lints: analysis.lints,
      gaps: analysis.gaps,
      darkSpots: analysis.darkSpots,
    }).toStrictEqual({ driven: [true, true, true, true, true], undriven: [], lints: [], gaps: [], darkSpots: [] });
  });
});
