import { ValueExprStub } from '@assayer/shared/contracts/value-expr/value-expr.stub';

import { valueExprResolveTransformer } from './value-expr-resolve-transformer';

const SELECT = ValueExprStub({
  kind: 'select',
  branch: 'f/ternary:x',
  then: { kind: 'param', name: 'x' },
  else: { kind: 'lit', value: 'NoneTon' },
});

describe('valueExprResolveTransformer', () => {
  it('VALID: {then arm taken} => the then value', () => {
    expect(valueExprResolveTransformer({ expr: SELECT, armByBranch: new Map([['f/ternary:x', 'then']]) })).toStrictEqual({
      kind: 'param',
      name: 'x',
    });
  });

  it('VALID: {else arm taken} => the else value', () => {
    expect(valueExprResolveTransformer({ expr: SELECT, armByBranch: new Map([['f/ternary:x', 'else']]) })).toStrictEqual({
      kind: 'lit',
      value: 'NoneTon',
    });
  });

  it('VALID: {a method over a select} => the method over the chosen value', () => {
    const expr = ValueExprStub({ kind: 'method', name: 'trim', receiver: SELECT, args: [] });

    expect(valueExprResolveTransformer({ expr, armByBranch: new Map([['f/ternary:x', 'then']]) })).toStrictEqual({
      kind: 'method',
      name: 'trim',
      receiver: { kind: 'param', name: 'x' },
      args: [],
    });
  });

  it('EMPTY: {no arm taken at the branch} => undefined, because the value is not decided', () => {
    expect(valueExprResolveTransformer({ expr: SELECT, armByBranch: new Map() })).toBe(undefined);
  });
});
