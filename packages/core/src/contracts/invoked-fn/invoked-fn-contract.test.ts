import { invokedFnContract } from './invoked-fn-contract';
import { InvokedFnStub } from './invoked-fn.stub';

describe('invokedFnContract', () => {
  describe('valid invoked functions', () => {
    it('VALID: {startLine and one welded literal arg} => parses, carrying the invocation value', () => {
      expect(invokedFnContract.parse({ startLine: 7, args: [{ kind: 'literal', value: 7 }] })).toStrictEqual({
        startLine: 7,
        args: [{ kind: 'literal', value: 7 }],
      });
    });

    it('EMPTY: {stub default} => start line 1 with no invocation arguments', () => {
      expect(InvokedFnStub()).toStrictEqual({
        startLine: 1,
        args: [],
      });
    });
  });
});
