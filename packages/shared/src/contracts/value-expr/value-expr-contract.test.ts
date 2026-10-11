import { valueExprContract } from './value-expr-contract';
import { ValueExprStub } from './value-expr.stub';

describe('valueExprContract', () => {
  describe('valid value expressions', () => {
    it('VALID: {stub default} => parses a parameter', () => {
      const expression = ValueExprStub();

      expect(valueExprContract.parse(expression)).toStrictEqual({ kind: 'param', name: 'value' });
    });

    it('VALID: {a select between a parameter and a literal} => parses the nested expression', () => {
      const expression = ValueExprStub({
        kind: 'select',
        branch: 'f/ternary:x',
        then: { kind: 'param', name: 'x' },
        else: { kind: 'lit', value: 'NoneTon' },
      });

      expect(valueExprContract.parse(expression)).toStrictEqual(expression);
    });

    it('VALID: {a method over a select} => parses receiver and arguments', () => {
      const expression = ValueExprStub({
        kind: 'method',
        name: 'slice',
        receiver: { kind: 'param', name: 'x' },
        args: [
          { kind: 'lit', value: 1 },
          { kind: 'lit', value: -1 },
        ],
      });

      expect(valueExprContract.parse(expression)).toStrictEqual(expression);
    });
  });

  describe('invalid value expressions', () => {
    it('INVALID: {a method the engine cannot evaluate} => throws validation error', () => {
      expect(() =>
        valueExprContract.parse({ kind: 'method', name: 'split', receiver: { kind: 'param', name: 'x' }, args: [] }),
      ).toThrow(/Invalid option/u);
    });
  });
});
