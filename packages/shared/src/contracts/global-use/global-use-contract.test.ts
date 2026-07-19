import { globalUseContract } from './global-use-contract';
import { GlobalUseStub } from './global-use.stub';

describe('globalUseContract', () => {
  describe('valid global uses', () => {
    it('VALID: {stub default} => a called console.log member use with one opaque arg', () => {
      const use = GlobalUseStub();

      const result = globalUseContract.parse(use);

      expect(result).toStrictEqual({
        name: 'console',
        member: 'log',
        called: true,
        args: [{ kind: 'opaque' }],
        line: 1,
        column: 1,
      });
    });

    it('VALID: {a member access that is not called} => process.env with no args', () => {
      const result = globalUseContract.parse({
        name: 'process',
        member: 'env',
        called: false,
        args: [],
        line: 3,
        column: 1,
      });

      expect(result).toStrictEqual({
        name: 'process',
        member: 'env',
        called: false,
        args: [],
        line: 3,
        column: 1,
      });
    });

    it('VALID: {a bare-identifier call} => setTimeout with a param-ref and a literal arg, no member', () => {
      const result = globalUseContract.parse({
        name: 'setTimeout',
        called: true,
        args: [{ kind: 'param-ref', paramName: 'fn' }, { kind: 'literal', value: 0 }],
        line: 2,
        column: 1,
      });

      expect(result).toStrictEqual({
        name: 'setTimeout',
        called: true,
        args: [{ kind: 'param-ref', paramName: 'fn' }, { kind: 'literal', value: 0 }],
        line: 2,
        column: 1,
      });
    });
  });

  describe('invalid global uses', () => {
    it('INVALID: {an arg kind that is not projected} => throws on the discriminator', () => {
      expect(() => {
        return globalUseContract.parse({
          name: 'console',
          member: 'log',
          called: true,
          args: [{ kind: 'spread' }],
          line: 1,
          column: 1,
        });
      }).toThrow(/Invalid discriminator value/u);
    });
  });
});
