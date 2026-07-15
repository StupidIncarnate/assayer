import { scopeRecordContract } from './scope-record-contract';
import { ScopeRecordStub } from './scope-record.stub';

describe('scopeRecordContract', () => {
  describe('valid scope records', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const record = ScopeRecordStub();

      const result = scopeRecordContract.parse(record);

      expect(result).toStrictEqual(record);
    });

    it('VALID: {kind: "module"} => parses a module scope with no params', () => {
      const record = ScopeRecordStub({
        scopePath: ['*module*'],
        name: '*module*',
        kind: 'module',
        exported: false,
        params: [],
        returnType: { kind: 'unknown', text: 'void' },
      });

      const result = scopeRecordContract.parse(record);

      expect(result).toStrictEqual(record);
    });

    it('VALID: {nested scopePath} => parses a class method scope', () => {
      const record = ScopeRecordStub({ scopePath: ['Classifier', 'classify'], name: 'classify' });

      const result = scopeRecordContract.parse(record);

      expect(result).toStrictEqual(record);
    });
  });

  describe('invalid scope records', () => {
    it('INVALID: {kind: "class"} => throws validation error (classes hold no control flow)', () => {
      expect(() => {
        return scopeRecordContract.parse({
          scopePath: ['Classifier'],
          name: 'Classifier',
          kind: 'class',
          exported: true,
          params: [],
          returnType: { kind: 'string' },
          line: 1,
          branches: [],
          exits: [],
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
