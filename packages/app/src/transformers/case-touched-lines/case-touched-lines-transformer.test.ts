import { FunctionAnalysisStub, CoverageIdStub } from '@assayer/shared/contracts';

import { caseTouchedLinesTransformer } from './case-touched-lines-transformer';

describe('caseTouchedLinesTransformer', () => {
  describe('a case reaching a guarded exit', () => {
    it('VALID: {then-exit} => the exit line plus its guard branch line', () => {
      const functionAnalysis = FunctionAnalysisStub();

      const result = caseTouchedLinesTransformer({
        functionAnalysis,
        reachesExit: CoverageIdStub({ value: 'formatGreeting/return@if-then' }),
      });

      expect(result).toStrictEqual([3, 2]);
    });
  });

  describe('an unknown exit', () => {
    it('EMPTY: {reachesExit not found} => no touched lines', () => {
      const functionAnalysis = FunctionAnalysisStub();

      const result = caseTouchedLinesTransformer({
        functionAnalysis,
        reachesExit: CoverageIdStub({ value: 'nope/exit@x' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
