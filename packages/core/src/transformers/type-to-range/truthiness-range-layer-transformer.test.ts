import { ValueDomainStub } from '../../contracts/value-domain/value-domain.stub';
import { truthinessRangeLayerTransformer } from './truthiness-range-layer-transformer';

describe('truthinessRangeLayerTransformer', () => {
  it('VALID: {truthy number} => truthy excludes 0, falsy is 0', () => {
    expect(truthinessRangeLayerTransformer({ type: { kind: 'number' }, predicateKind: 'truthy' })).toStrictEqual({
      satisfying: ValueDomainStub({ excluded: [0] }),
      violating: ValueDomainStub({ members: [0] }),
    });
  });

  it('VALID: {falsy number} => the mirror', () => {
    expect(truthinessRangeLayerTransformer({ type: { kind: 'number' }, predicateKind: 'falsy' })).toStrictEqual({
      satisfying: ValueDomainStub({ members: [0] }),
      violating: ValueDomainStub({ excluded: [0] }),
    });
  });

  it('VALID: {truthy boolean} => true against false', () => {
    expect(truthinessRangeLayerTransformer({ type: { kind: 'boolean' }, predicateKind: 'truthy' })).toStrictEqual({
      satisfying: ValueDomainStub({ members: [true] }),
      violating: ValueDomainStub({ members: [false] }),
    });
  });

  it('VALID: {falsy boolean} => false against true', () => {
    expect(truthinessRangeLayerTransformer({ type: { kind: 'boolean' }, predicateKind: 'falsy' })).toStrictEqual({
      satisfying: ValueDomainStub({ members: [false] }),
      violating: ValueDomainStub({ members: [true] }),
    });
  });

  it('VALID: {truthy number | string union} => truthy excludes every falsy point of its members', () => {
    expect(
      truthinessRangeLayerTransformer({ type: { kind: 'union', members: [{ kind: 'number' }, { kind: 'string' }] }, predicateKind: 'truthy' }),
    ).toStrictEqual({
      satisfying: ValueDomainStub({ excluded: [0, ''] }),
      violating: ValueDomainStub({ members: [0, ''] }),
    });
  });

  it('VALID: {falsy number | string union} => falsy is exactly those points', () => {
    expect(
      truthinessRangeLayerTransformer({ type: { kind: 'union', members: [{ kind: 'number' }, { kind: 'string' }] }, predicateKind: 'falsy' }),
    ).toStrictEqual({
      satisfying: ValueDomainStub({ members: [0, ''] }),
      violating: ValueDomainStub({ excluded: [0, ''] }),
    });
  });

  it('VALID: {truthy string} => the representative against the empty string', () => {
    expect(truthinessRangeLayerTransformer({ type: { kind: 'string' }, predicateKind: 'truthy' })).toStrictEqual({
      satisfying: ValueDomainStub({ members: ['abc123'] }),
      violating: ValueDomainStub({ members: [''] }),
    });
  });

  it('VALID: {falsy string} => the empty string against the representative', () => {
    expect(truthinessRangeLayerTransformer({ type: { kind: 'string' }, predicateKind: 'falsy' })).toStrictEqual({
      satisfying: ValueDomainStub({ members: [''] }),
      violating: ValueDomainStub({ members: ['abc123'] }),
    });
  });

  it('EMPTY: {truthy on a type with no scalar point} => both arms unconstrained', () => {
    expect(truthinessRangeLayerTransformer({ type: { kind: 'unknown', text: 'Db' }, predicateKind: 'truthy' })).toStrictEqual({
      satisfying: ValueDomainStub(),
      violating: ValueDomainStub(),
    });
  });

  it('EMPTY: {falsy on a type with no scalar point} => both arms unconstrained', () => {
    expect(truthinessRangeLayerTransformer({ type: { kind: 'unknown', text: 'Db' }, predicateKind: 'falsy' })).toStrictEqual({
      satisfying: ValueDomainStub(),
      violating: ValueDomainStub(),
    });
  });
});
