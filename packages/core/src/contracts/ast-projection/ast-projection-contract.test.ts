import { astProjectionContract } from './ast-projection-contract';
import { AstProjectionStub } from './ast-projection.stub';

describe('astProjectionContract', () => {
  describe('valid projections', () => {
    it('VALID: {identifier token} => parses the default stub', () => {
      const projection = AstProjectionStub();

      const result = astProjectionContract.parse(projection);

      expect(result).toBe('id:name');
    });

    it('VALID: {condition token stream} => parses a comma-joined projection', () => {
      const result = astProjectionContract.parse('BinaryExpression,id:name,EqualsEqualsEqualsToken,str:blah');

      expect(result).toBe('BinaryExpression,id:name,EqualsEqualsEqualsToken,str:blah');
    });
  });

  describe('invalid projections', () => {
    it('INVALID: {empty string} => throws validation error', () => {
      expect(() => {
        return astProjectionContract.parse('');
      }).toThrow(/at least 1/u);
    });
  });
});
