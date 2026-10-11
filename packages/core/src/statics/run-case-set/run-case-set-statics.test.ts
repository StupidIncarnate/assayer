import { runCaseSetStatics } from './run-case-set-statics';

describe('runCaseSetStatics', () => {
  it('VALID: {runs} => the runner runs the fewest-runs set', () => {
    expect(runCaseSetStatics.runs).toBe('fewest-runs');
  });
});
