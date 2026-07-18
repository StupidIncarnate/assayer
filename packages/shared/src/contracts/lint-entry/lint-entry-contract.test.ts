import { lintEntryContract } from './lint-entry-contract';
import { LintEntryStub } from './lint-entry.stub';

describe('lintEntryContract', () => {
  describe('valid lint entries', () => {
    it('VALID: {stub default} => parses a dead-surface lint carrying its rule, name, message and span', () => {
      const lint = LintEntryStub();

      const result = lintEntryContract.parse(lint);

      expect(result).toStrictEqual({
        rule: 'dead-surface',
        name: 'decide',
        message: 'nothing in this file calls it, so it is dead surface',
        startLine: 1,
        endLine: 7,
      });
    });
  });

  describe('invalid lint entries', () => {
    it('INVALID: {rule: "made-up"} => throws, since only declared rules exist', () => {
      expect(() => {
        return lintEntryContract.parse({ rule: 'made-up', name: 'decide', message: 'x', startLine: 1, endLine: 7 });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {message: ""} => throws, since a lint with no message is unactionable', () => {
      expect(() => {
        return lintEntryContract.parse({ rule: 'dead-surface', name: 'decide', message: '', startLine: 1, endLine: 7 });
      }).toThrow(/message/u);
    });
  });
});
