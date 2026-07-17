import {
  FunctionAnalysisStub,
  BranchNodeStub,
  ExitNodeStub,
  DerivedTestCaseStub,
} from '@assayer/shared/contracts';

import { caseGutterMarkersTransformer } from './case-gutter-markers-transformer';

describe('caseGutterMarkersTransformer', () => {
  describe('a format-greeting-shaped analysis: a shared `if` guard with a then-exit and a fall-through exit', () => {
    it('VALID: {2 cases through 1 shared guard} => markers L2 count 2, L3 count 1, L6 count 1', () => {
      // Two cases: the then-case reaches L3 through the L2 guard ([3, 2]); the fall-through case
      // reaches L6 through the same L2 guard ([6, 2]). Aggregated by hand: L2 is on both paths (2),
      // L3 and L6 are each on one (1). Derived without running the transformer (project P4 rule).
      const functionAnalysis = FunctionAnalysisStub({
        branches: [BranchNodeStub()],
        exits: [
          ExitNodeStub(),
          ExitNodeStub({
            coverageId: 'formatGreeting/return@fallthrough',
            guardPath: [{ branchCoverageId: 'formatGreeting/if:name.length===0', arm: 'else' }],
            line: 6,
          }),
        ],
        cases: [
          DerivedTestCaseStub(),
          DerivedTestCaseStub({
            reachesExit: 'formatGreeting/return@fallthrough',
            arrange: [{ kind: 'param', param: 'name', value: 'a' }],
          }),
        ],
      });

      const result = caseGutterMarkersTransformer({ functions: [functionAnalysis] });

      expect([...result].sort((first, second) => first.line - second.line)).toStrictEqual([
        { line: 2, count: 2 },
        { line: 3, count: 1 },
        { line: 6, count: 1 },
      ]);
    });
  });

  describe('no analyzed functions', () => {
    it('EMPTY: {functions: []} => no markers', () => {
      const result = caseGutterMarkersTransformer({ functions: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
