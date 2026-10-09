import { scopeRecordContract } from './scope-record-contract';
import { ScopeRecordStub } from './scope-record.stub';
import { FallthroughArmStub } from '../fallthrough-arm/fallthrough-arm.stub';
import { IndexDemandStub } from '../index-demand/index-demand.stub';

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

    it('VALID: {a boolean predicate scope} => carries its decomposed return comparison as predicateSignature', () => {
      const record = ScopeRecordStub({
        scopePath: ['*module*', 'tooBig'],
        name: 'tooBig',
        returnType: { kind: 'boolean' },
        predicateSignature: {
          kind: 'leaf',
          id: '*module*/tooBig/predicate#leaf',
          operandParamName: 'n',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 50 },
        },
      });

      const result = scopeRecordContract.parse(record);

      expect(result).toStrictEqual(record);
    });

    it('VALID: {indexDemands} => carries indexDemands array', () => {
      const record = ScopeRecordStub({
        indexDemands: [IndexDemandStub()],
      });

      const result = scopeRecordContract.parse(record);

      expect(result).toStrictEqual(record);
    });

    it('VALID: {fallthroughArms} => carries the fall-through arm records', () => {
      const record = ScopeRecordStub({
        fallthroughArms: [FallthroughArmStub()],
      });

      const result = scopeRecordContract.parse(record);

      expect(result.fallthroughArms).toStrictEqual([
        { guardPath: [{ branchCoverageId: 'formatGreeting/if:name.length===0', arm: 'then' }], startLine: 4, endLine: 4 },
      ]);
    });

    it('EMPTY: {fallthroughArms omitted} => defaults to an empty list', () => {
      const result = scopeRecordContract.parse({
        scopePath: ['classify'],
        name: 'classify',
        kind: 'function',
        exported: true,
        access: { kind: 'named' },
        params: [],
        returnType: { kind: 'string' },
        startLine: 1,
        endLine: 3,
        branches: [],
        exits: [],
      });

      expect(result.fallthroughArms).toStrictEqual([]);
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
      }).toThrow(/Invalid option: expected one of/u);
    });
  });
});
