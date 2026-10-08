import { indexDemandContract } from './index-demand-contract';
import { IndexDemandStub } from './index-demand.stub';

describe('indexDemandContract', () => {
  describe('valid index demands', () => {
    it('VALID: {param-index with at operation} => parses cleanly', () => {
      expect(
        indexDemandContract.parse({
          kind: 'param-index',
          param: 'index',
          operation: 'at',
        }),
      ).toStrictEqual({
        kind: 'param-index',
        param: 'index',
        operation: 'at',
      });
    });

    it('VALID: {param-index with bracket operation} => parses cleanly', () => {
      expect(
        indexDemandContract.parse({
          kind: 'param-index',
          param: 'idx',
          operation: 'bracket',
        }),
      ).toStrictEqual({
        kind: 'param-index',
        param: 'idx',
        operation: 'bracket',
      });
    });

    it('VALID: {array-length-index demand} => parses with targetLength', () => {
      expect(
        indexDemandContract.parse({
          kind: 'array-length-index',
          arrayParam: 'someArr',
          targetLength: 3,
          operation: 'at',
        }),
      ).toStrictEqual({
        kind: 'array-length-index',
        arrayParam: 'someArr',
        targetLength: 3,
        operation: 'at',
      });
    });

    it('VALID: {stub default} => parses default stub', () => {
      expect(IndexDemandStub()).toStrictEqual({
        kind: 'param-index',
        param: 'index',
        operation: 'at',
      });
    });
  });

  describe('invalid index demands', () => {
    it('INVALID: {empty param name} => throws too_small', () => {
      expect(() =>
        indexDemandContract.parse({
          kind: 'param-index',
          param: '',
          operation: 'at',
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID: {negative targetLength} => throws too_small', () => {
      expect(() =>
        indexDemandContract.parse({
          kind: 'array-length-index',
          arrayParam: 'someArr',
          targetLength: -1,
          operation: 'at',
        }),
      ).toThrow(/too_small/u);
    });
  });
});
