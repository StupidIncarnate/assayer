import { harnessKeyPathContract } from './harness-key-path-contract';
import { HarnessKeyPathStub } from './harness-key-path.stub';

describe('harnessKeyPathContract', () => {
  describe('a declared input path', () => {
    it('VALID: {inputs.audit.report} => parses the dotted route', () => {
      expect(harnessKeyPathContract.parse(HarnessKeyPathStub())).toBe('inputs.audit.report');
    });

    it('VALID: {inputs.tally.emit} => parses another entry/parameter pair', () => {
      expect(harnessKeyPathContract.parse('inputs.tally.emit')).toBe('inputs.tally.emit');
    });
  });

  describe('a malformed path', () => {
    it('EMPTY: {""} => throws, since an empty route names nothing', () => {
      expect(() => harnessKeyPathContract.parse('')).toThrow(/too_small|at least 1/u);
    });

    it('INVALID: {a number} => throws validation error', () => {
      expect(() => harnessKeyPathContract.parse(7)).toThrow(/Invalid input: expected string, received number/u);
    });
  });
});
