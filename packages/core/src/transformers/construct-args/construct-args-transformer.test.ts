import { DerivedTestCaseStub } from '@assayer/shared/contracts/derived-test-case/derived-test-case.stub';

import { constructArgsTransformer } from './construct-args-transformer';

describe('constructArgsTransformer', () => {
  describe('plain data bindings', () => {
    it('VALID: {a param binding} => one argument holding its value', () => {
      const { arrange } = DerivedTestCaseStub({ arrange: [{ kind: 'param', param: 'url', value: 'abc123' }] });

      expect(constructArgsTransformer({ construct: arrange })).toStrictEqual(['abc123']);
    });

    it('VALID: {a param and an object binding} => one argument each, in order', () => {
      const { arrange } = DerivedTestCaseStub({
        arrange: [
          { kind: 'param', param: 'url', value: 'abc123' },
          { kind: 'object', param: 'options', value: { retries: 7 } },
        ],
      });

      expect(constructArgsTransformer({ construct: arrange })).toStrictEqual(['abc123', { retries: 7 }]);
    });

    it('VALID: {an array binding} => one argument, the array itself', () => {
      const { arrange } = DerivedTestCaseStub({ arrange: [{ kind: 'array', param: 'hosts', value: ['abc123'] }] });

      expect(constructArgsTransformer({ construct: arrange })).toStrictEqual([['abc123']]);
    });

    it('VALID: {an array binding for a rest parameter} => its elements spread across the tail slots', () => {
      const { arrange } = DerivedTestCaseStub({
        arrange: [
          { kind: 'param', param: 'url', value: 'abc123' },
          { kind: 'array', param: 'hosts', value: [7, 8], rest: true },
        ],
      });

      expect(constructArgsTransformer({ construct: arrange })).toStrictEqual(['abc123', 7, 8]);
    });
  });

  describe('bindings that carry no argument', () => {
    it('VALID: {an env and a harness binding} => no arguments', () => {
      const { arrange } = DerivedTestCaseStub({
        arrange: [
          { kind: 'env', name: 'MODE', value: 'a' },
          { kind: 'harness', param: 'url', key: 'inputs.constructor.url' },
        ],
      });

      expect(constructArgsTransformer({ construct: arrange })).toStrictEqual([]);
    });
  });

  describe('no bindings', () => {
    it('EMPTY: {construct omitted} => no arguments', () => {
      expect(constructArgsTransformer({})).toStrictEqual([]);
    });

    it('EMPTY: {construct is an empty list} => no arguments', () => {
      expect(constructArgsTransformer({ construct: [] })).toStrictEqual([]);
    });
  });
});
