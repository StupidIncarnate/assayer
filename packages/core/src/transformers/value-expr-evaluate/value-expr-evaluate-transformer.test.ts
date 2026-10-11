import { ValueExprStub } from '@assayer/shared/contracts/value-expr/value-expr.stub';

import { valueExprEvaluateTransformer } from './value-expr-evaluate-transformer';

const SLICE = ValueExprStub({
  kind: 'method',
  name: 'slice',
  receiver: { kind: 'param', name: 'x' },
  args: [
    { kind: 'lit', value: 1 },
    { kind: 'lit', value: -1 },
  ],
});

describe('valueExprEvaluateTransformer', () => {
  it("VALID: {slice(1, -1) of 'None'} => 'on'", () => {
    expect(valueExprEvaluateTransformer({ expr: SLICE, params: new Map([['x', 'None']]) })).toStrictEqual({ value: 'on' });
  });

  it('VALID: {a literal} => the literal', () => {
    expect(valueExprEvaluateTransformer({ expr: { kind: 'lit', value: null }, params: new Map() })).toStrictEqual({ value: null });
  });

  it('VALID: {toUpperCase of a parameter} => the upper-cased value', () => {
    const expr = ValueExprStub({ kind: 'method', name: 'toUpperCase', receiver: { kind: 'param', name: 'x' }, args: [] });

    expect(valueExprEvaluateTransformer({ expr, params: new Map([['x', 'on']]) })).toStrictEqual({ value: 'ON' });
  });

  it('EMPTY: {a parameter with no value} => undefined', () => {
    expect(valueExprEvaluateTransformer({ expr: SLICE, params: new Map() })).toBe(undefined);
  });

  it('EMPTY: {a string method applied to a number} => undefined', () => {
    expect(valueExprEvaluateTransformer({ expr: SLICE, params: new Map([['x', 7]]) })).toBe(undefined);
  });

  it('EMPTY: {an unresolved select} => undefined', () => {
    const expr = ValueExprStub({ kind: 'select', branch: 'f/ternary:x', then: { kind: 'lit', value: 1 }, else: { kind: 'lit', value: 2 } });

    expect(valueExprEvaluateTransformer({ expr, params: new Map() })).toBe(undefined);
  });
});
