import { statusResultContract } from './status-result-contract';
import { StatusResultStub } from './status-result.stub';

describe('statusResultContract', () => {
  describe('valid status results', () => {
    it('VALID: {version, message} => parses successfully', () => {
      const status = StatusResultStub();

      const result = statusResultContract.parse(status);

      expect(result).toStrictEqual({ version: '1.0.0', message: 'Assayer core online' });
    });

    it('VALID: {message override} => parses with custom message', () => {
      const status = StatusResultStub({ message: 'Assayer core ready' });

      const result = statusResultContract.parse(status);

      expect(result.message).toBe('Assayer core ready');
    });
  });

  describe('invalid status results', () => {
    it('INVALID: {version: ""} => throws validation error', () => {
      expect(() => {
        return statusResultContract.parse({ version: '', message: 'Assayer core online' });
      }).toThrow(/at least 1 character/u);
    });

    it('INVALID: {missing message} => throws validation error', () => {
      expect(() => {
        return statusResultContract.parse({ version: '1.0.0' });
      }).toThrow(/Required/u);
    });

    it('INVALID: {version: 123} => throws validation error', () => {
      expect(() => {
        return statusResultContract.parse({ version: 123, message: 'Assayer core online' });
      }).toThrow(/Expected string/u);
    });
  });
});
