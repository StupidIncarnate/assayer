import { ValueDomainStub } from '../../contracts/value-domain/value-domain.stub';
import { isTextInDomainGuard } from './is-text-in-domain-guard';

describe('isTextInDomainGuard', () => {
  it('VALID: {a string containing the required text} => true', () => {
    expect(isTextInDomainGuard({ value: 'Tonic', domain: ValueDomainStub({ includes: ['on'] }) })).toBe(true);
  });

  it('VALID: {a string missing the required text} => false', () => {
    expect(isTextInDomainGuard({ value: 'No', domain: ValueDomainStub({ includes: ['on'] }) })).toBe(false);
  });

  it('VALID: {a string containing forbidden text} => false', () => {
    expect(isTextInDomainGuard({ value: 'on', domain: ValueDomainStub({ notIncludes: ['on'] }) })).toBe(false);
  });

  it('VALID: {a string avoiding forbidden text} => true', () => {
    expect(isTextInDomainGuard({ value: 'abc', domain: ValueDomainStub({ notIncludes: ['on'] }) })).toBe(true);
  });

  it('VALID: {a number against a text axis} => true, since the axis says nothing about it', () => {
    expect(isTextInDomainGuard({ value: 7, domain: ValueDomainStub({ includes: ['on'] }) })).toBe(true);
  });

  it('EMPTY: {no domain} => true', () => {
    expect(isTextInDomainGuard({ value: 'x' })).toBe(true);
  });
});
