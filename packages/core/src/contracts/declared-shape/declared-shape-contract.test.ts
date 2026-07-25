import { declaredShapeContract } from './declared-shape-contract';
import { DeclaredShapeStub } from './declared-shape.stub';

describe('declaredShapeContract', () => {
  describe('valid declarations', () => {
    it('VALID: {an interface naming an object shape} => parses, name beside the descriptor', () => {
      expect(
        declaredShapeContract.parse({
          name: 'Config',
          type: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
        }),
      ).toStrictEqual({
        name: 'Config',
        type: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
      });
    });

    it('VALID: {an alias to a scalar} => parses, the name carried where the descriptor has no slot for it', () => {
      expect(declaredShapeContract.parse({ name: 'Id', type: { kind: 'string' } })).toStrictEqual({
        name: 'Id',
        type: { kind: 'string' },
      });
    });

    it('VALID: {an alias to a literal union} => parses with every member kept', () => {
      expect(
        declaredShapeContract.parse({
          name: 'Level',
          type: { kind: 'union', members: [{ kind: 'literal', value: 'low' }, { kind: 'literal', value: 'high' }] },
        }),
      ).toStrictEqual({
        name: 'Level',
        type: { kind: 'union', members: [{ kind: 'literal', value: 'low' }, { kind: 'literal', value: 'high' }] },
      });
    });

    it('VALID: {stub default} => a Config object shape named Config', () => {
      expect(DeclaredShapeStub()).toStrictEqual({
        name: 'Config',
        type: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
      });
    });

    it('VALID: {a generic declaration} => carries typeParams as the slots its type arguments fill', () => {
      expect(
        declaredShapeContract.parse({
          name: 'Box',
          type: { kind: 'object', typeName: 'Box', properties: [{ name: 'value', type: { kind: 'unknown', text: 'T' } }] },
          typeParams: ['T'],
        }),
      ).toStrictEqual({
        name: 'Box',
        type: { kind: 'object', typeName: 'Box', properties: [{ name: 'value', type: { kind: 'unknown', text: 'T' } }] },
        typeParams: ['T'],
      });
    });
  });

  describe('invalid declarations', () => {
    it('INVALID: {an empty name} => throws too_small', () => {
      expect(() => declaredShapeContract.parse({ name: '', type: { kind: 'string' } })).toThrow(/too_small/u);
    });

    it('INVALID: {no name} => throws Required', () => {
      expect(() => declaredShapeContract.parse({ type: { kind: 'string' } })).toThrow(/Required/u);
    });

    it('INVALID: {no type} => throws invalid_type', () => {
      expect(() => declaredShapeContract.parse({ name: 'Id' })).toThrow(/invalid_type/u);
    });
  });
});
