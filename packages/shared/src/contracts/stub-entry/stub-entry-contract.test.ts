import { stubEntryContract } from './stub-entry-contract';
import { StubEntryStub } from './stub-entry.stub';

describe('stubEntryContract', () => {
  it('VALID: {default stub} => parses with the default key', () => {
    const value = StubEntryStub();

    expect(value.key).toBe('src/config/config.ts#Config');
  });

  it('INVALID: {key: ""} => is rejected', () => {
    const result = stubEntryContract.safeParse({ key: '' });

    expect(result.success).toBe(false);
  });
});
