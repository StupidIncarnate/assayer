import { ValueExprStub } from '@assayer/shared/contracts/value-expr/value-expr.stub';

import { valueExprParamsTransformer } from './value-expr-params-transformer';

describe('valueExprParamsTransformer', () => {
  it('VALID: {a select between a parameter and a literal} => the parameter', () => {
    const expr = ValueExprStub({ kind: 'select', branch: 'f/ternary:x', then: { kind: 'param', name: 'n' }, else: { kind: 'lit', value: 'NoneTon' } });

    expect(valueExprParamsTransformer({ expr })).toStrictEqual(['n']);
  });

  it('VALID: {a method reading one parameter twice} => the parameter once', () => {
    const expr = ValueExprStub({
      kind: 'method',
      name: 'slice',
      receiver: { kind: 'param', name: 'n' },
      args: [{ kind: 'param', name: 'n' }],
    });

    expect(valueExprParamsTransformer({ expr })).toStrictEqual(['n']);
  });

  it('EMPTY: {a literal} => no parameters', () => {
    expect(valueExprParamsTransformer({ expr: { kind: 'lit', value: 1 } })).toStrictEqual([]);
  });
});
