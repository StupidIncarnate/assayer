import { undrivenEntryContract } from './undriven-entry-contract';
import { UndrivenEntryStub } from './undriven-entry.stub';

describe('undrivenEntryContract', () => {
  describe('valid undriven entries', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const entry = UndrivenEntryStub();

      const result = undrivenEntryContract.parse(entry);

      expect(result).toStrictEqual(entry);
    });

    it('VALID: {a private helper} => parses with its own name and reason', () => {
      const entry = UndrivenEntryStub({
        name: 'inner',
        reason: 'it is not exported, so nothing outside the module can call it',
      });

      const result = undrivenEntryContract.parse(entry);

      expect(result).toStrictEqual(entry);
    });
  });

  describe('invalid undriven entries', () => {
    // The reason IS the channel's product: an entry naming what went undriven without saying why
    // tells a reader there is a hole and nothing about who can close it.
    it('INVALID: {reason: ""} => throws, since a reason nobody can read admits nothing', () => {
      expect(() => {
        return undrivenEntryContract.parse({ name: '*module*', reason: '' });
      }).toThrow(/at least 1 character/u);
    });

    it('INVALID: {no name} => throws validation error', () => {
      expect(() => {
        return undrivenEntryContract.parse({ reason: 'it runs at import time' });
      }).toThrow(/Required/u);
    });
  });
});
