import { ArmValuesStub } from '../../contracts/arm-values/arm-values.stub';
import { stringComparisonLayerTransformer } from './string-comparison-layer-transformer';

describe('stringComparisonLayerTransformer', () => {
  it('VALID: {gt, "m"} => satisfying literal + "a", violating literal', () => {
    const result = stringComparisonLayerTransformer({ predicateKind: 'gt', literal: 'm' });

    expect(result).toStrictEqual(
      ArmValuesStub({
        satisfying: { members: ['ma'] },
        violating: { members: ['m'] },
      }),
    );
  });

  it('VALID: {gte, "m"} => satisfying literal, violating empty string', () => {
    const result = stringComparisonLayerTransformer({ predicateKind: 'gte', literal: 'm' });

    expect(result).toStrictEqual(
      ArmValuesStub({
        satisfying: { members: ['m'] },
        violating: { members: [''] },
      }),
    );
  });

  it('EDGE: {gte, ""} => satisfying empty string, violating empty array', () => {
    const result = stringComparisonLayerTransformer({ predicateKind: 'gte', literal: '' });

    expect(result).toStrictEqual(
      ArmValuesStub({
        satisfying: { members: [''] },
        violating: { members: [] },
      }),
    );
  });

  it('VALID: {lt, "m"} => satisfying empty string, violating literal', () => {
    const result = stringComparisonLayerTransformer({ predicateKind: 'lt', literal: 'm' });

    expect(result).toStrictEqual(
      ArmValuesStub({
        satisfying: { members: [''] },
        violating: { members: ['m'] },
      }),
    );
  });

  it('EDGE: {lt, ""} => satisfying empty array, violating empty string', () => {
    const result = stringComparisonLayerTransformer({ predicateKind: 'lt', literal: '' });

    expect(result).toStrictEqual(
      ArmValuesStub({
        satisfying: { members: [] },
        violating: { members: [''] },
      }),
    );
  });

  it('VALID: {lte, "m"} => satisfying literal, violating literal + "a"', () => {
    const result = stringComparisonLayerTransformer({ predicateKind: 'lte', literal: 'm' });

    expect(result).toStrictEqual(
      ArmValuesStub({
        satisfying: { members: ['m'] },
        violating: { members: ['ma'] },
      }),
    );
  });
});

