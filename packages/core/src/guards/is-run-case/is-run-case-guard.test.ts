import { DerivedTestCaseStub } from '@assayer/shared/contracts/derived-test-case/derived-test-case.stub';

import { isRunCaseGuard } from './is-run-case-guard';

describe('isRunCaseGuard', () => {
  it('VALID: {driven, in the fewest-runs set} => true', () => {
    expect(isRunCaseGuard({ testCase: DerivedTestCaseStub({ driven: true, fewestRuns: true }) })).toBe(true);
  });

  it('VALID: {driven, outside the fewest-runs set} => false, because only the fewest-runs set runs', () => {
    expect(isRunCaseGuard({ testCase: DerivedTestCaseStub({ driven: true, fewestRuns: false }) })).toBe(false);
  });

  it('VALID: {undriven, in the fewest-runs set} => false, because an undriven case is listed and never run', () => {
    expect(isRunCaseGuard({ testCase: DerivedTestCaseStub({ driven: false, fewestRuns: true }) })).toBe(false);
  });

  it('EMPTY: {no case} => false', () => {
    expect(isRunCaseGuard({})).toBe(false);
  });
});
