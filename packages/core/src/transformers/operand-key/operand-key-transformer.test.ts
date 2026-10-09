import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';

import { operandKeyTransformer } from './operand-key-transformer';

describe('operandKeyTransformer', () => {
  it('VALID: {a parameter operand} => the parameter name', () => {
    const leaf = ConditionLeafStub({ id: 'x#leaf', operandParamName: 'score', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 5 } });

    expect(operandKeyTransformer({ leaf })).toBe('score');
  });

  it('VALID: {an environment read through a const} => the read and its steps, not the const name', () => {
    const leaf = ConditionLeafStub({
      id: 'm#leaf',
      operandParamName: 'value',
      operandEnvVarName: 'VALUE',
      operandEnvSteps: [{ kind: 'number' }],
      operandType: { kind: 'number' },
      predicate: { kind: 'gt', literal: 5 },
    });

    expect(operandKeyTransformer({ leaf })).toBe('Number(process.env.VALUE)');
  });

  it('VALID: {an environment read in place} => the read itself', () => {
    const leaf = ConditionLeafStub({
      id: 'm#leaf',
      operandParamName: 'process.env.MODE',
      operandEnvVarName: 'MODE',
      operandType: { kind: 'string' },
      predicate: { kind: 'eq', literal: 'production' },
    });

    expect(operandKeyTransformer({ leaf })).toBe('process.env.MODE');
  });

  it('EMPTY: {no operand name} => undefined', () => {
    const { operandParamName: _named, ...leaf } = ConditionLeafStub({ id: 'x#leaf', predicate: { kind: 'truthy' } });

    expect(operandKeyTransformer({ leaf })).toBe(undefined);
  });
});
