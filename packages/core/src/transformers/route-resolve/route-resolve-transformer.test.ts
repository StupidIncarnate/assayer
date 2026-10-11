import { ConditionCauseStub } from '../../contracts/condition-cause/condition-cause.stub';
import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';
import { ParamDescriptorStub } from '@assayer/shared/contracts/param-descriptor/param-descriptor.stub';
import { ValueExprStub } from '@assayer/shared/contracts/value-expr/value-expr.stub';

import { routeResolveTransformer } from './route-resolve-transformer';

const PARAMS = [ParamDescriptorStub({ name: 'n', type: { kind: 'string' } })];
const SELECT = ValueExprStub({
  kind: 'select',
  branch: 'f/ternary:x',
  then: { kind: 'param', name: 'n' },
  else: { kind: 'lit', value: 'NoneTon' },
});
const leafOver = (props: Parameters<typeof ConditionLeafStub>[0]): ReturnType<typeof ConditionLeafStub> =>
  ConditionLeafStub({
    id: 'f/if:a#leaf',
    operandParamName: 'data',
    operandType: { kind: 'string' },
    predicate: { kind: 'eq', literal: 'None' },
    ...props,
  });

describe('routeResolveTransformer', () => {
  it('VALID: {a flow that resolves to a parameter} => the leaf reads the parameter', () => {
    const leaf = leafOver({ operandFlow: SELECT });

    const result = routeResolveTransformer({
      requirements: ConditionCauseStub({ requirements: [{ leaf, want: true }] }).requirements,
      armByBranch: new Map([['f/ternary:x', 'then']]),
      params: PARAMS,
    });

    expect({
      operands: result.requirements.map((requirement) => requirement.leaf.operandParamName),
      derived: result.derived,
      undecidable: result.undecidable,
    }).toStrictEqual({ operands: ['n'], derived: [], undecidable: false });
  });

  it('VALID: {a flow that resolves to a literal} => the leaf is welded to that value, under its own name', () => {
    const leaf = leafOver({ operandFlow: SELECT });

    const result = routeResolveTransformer({
      requirements: ConditionCauseStub({ requirements: [{ leaf, want: true }] }).requirements,
      armByBranch: new Map([['f/ternary:x', 'else']]),
      params: PARAMS,
    });

    expect(result.requirements.map((requirement) => [requirement.leaf.operandParamName, requirement.leaf.operandConstValue])).toStrictEqual([
      ['f/if:a#leaf', 'NoneTon'],
    ]);
  });

  it('VALID: {a flow that is a function of a parameter} => a derived requirement', () => {
    const leaf = leafOver({
      operandFlow: ValueExprStub({ kind: 'method', name: 'trim', receiver: SELECT, args: [] }),
    });

    const result = routeResolveTransformer({
      requirements: ConditionCauseStub({ requirements: [{ leaf, want: false }] }).requirements,
      armByBranch: new Map([['f/ternary:x', 'then']]),
      params: PARAMS,
    });

    expect({ requirements: result.requirements, derived: result.derived.map((entry) => [entry.want, entry.expr]) }).toStrictEqual({
      requirements: [],
      derived: [[false, { kind: 'method', name: 'trim', receiver: { kind: 'param', name: 'n' }, args: [] }]],
    });
  });

  it('VALID: {a leaf with no flow} => unchanged', () => {
    const leaf = ConditionLeafStub();

    const result = routeResolveTransformer({ requirements: ConditionCauseStub({ requirements: [{ leaf, want: true }] }).requirements, armByBranch: new Map(), params: PARAMS });

    expect(result).toStrictEqual({ requirements: [{ leaf, want: true }], derived: [], undecidable: false });
  });

  it('EMPTY: {a flow that depends on a branch the route never took} => undecidable', () => {
    const leaf = leafOver({ operandFlow: SELECT });

    const result = routeResolveTransformer({ requirements: ConditionCauseStub({ requirements: [{ leaf, want: true }] }).requirements, armByBranch: new Map(), params: PARAMS });

    expect(result.undecidable).toBe(true);
  });
});
