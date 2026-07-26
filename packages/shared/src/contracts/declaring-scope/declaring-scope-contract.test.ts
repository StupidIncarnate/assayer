import { declaringScopeContract } from './declaring-scope-contract';
import { DeclaringScopeStub } from './declaring-scope.stub';

describe('declaringScopeContract', () => {
  describe('valid declaring scopes', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const scope = DeclaringScopeStub();

      const result = declaringScopeContract.parse(scope);

      expect(result).toStrictEqual(scope);
    });

    it('VALID: {params: []} => a declaring scope that takes no parameters still parses', () => {
      const scope = DeclaringScopeStub({ params: [] });

      const result = declaringScopeContract.parse(scope);

      expect(result).toStrictEqual(scope);
    });
  });

  describe('invalid declaring scopes', () => {
    it('INVALID: {name: ""} => throws, since a scope with no name is not addressable', () => {
      expect(() => {
        return declaringScopeContract.parse({ name: '', hostEntry: 'audit', params: [] });
      }).toThrow(/at least 1 character/u);
    });

    it('INVALID: {no hostEntry} => throws, since a scope with nothing to call it through cannot be bound', () => {
      expect(() => {
        return declaringScopeContract.parse({ name: 'build', params: [] });
      }).toThrow(/hostEntry/u);
    });

    it('INVALID: {no params} => throws, since the caller cannot tell what the scope declares', () => {
      expect(() => {
        return declaringScopeContract.parse({ name: 'build', hostEntry: 'audit' });
      }).toThrow(/params/u);
    });
  });
});
