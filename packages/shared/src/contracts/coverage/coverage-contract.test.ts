import { coverageContract } from './coverage-contract';
import { CoverageStub } from './coverage.stub';

describe('coverageContract', () => {
  it('VALID: {default stub} => parses with the default id', () => {
    const value = CoverageStub();

    expect(value.id).toBe('formatGreeting/if:name.length===0');
  });

  it('INVALID: {id: ""} => is rejected', () => {
    const result = coverageContract.safeParse({ id: '' });

    expect(result.success).toBe(false);
  });
});
