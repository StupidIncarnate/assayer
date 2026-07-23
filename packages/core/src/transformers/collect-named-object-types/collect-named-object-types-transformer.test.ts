import { TypeDescriptorStub } from '@assayer/shared/contracts';

import { collectNamedObjectTypesTransformer } from './collect-named-object-types-transformer';

describe('collectNamedObjectTypesTransformer', () => {
  describe('descriptors carrying named objects', () => {
    it('VALID: {named object with a named nested object} => the outer and the nested shape', () => {
      const result = collectNamedObjectTypesTransformer({
        descriptor: TypeDescriptorStub({
          kind: 'object',
          typeName: 'Outer',
          properties: [{ name: 'inner', type: { kind: 'object', typeName: 'Inner', properties: [{ name: 'x', type: { kind: 'number' } }] } }],
        }),
      });

      expect(result).toStrictEqual([
        {
          name: 'Outer',
          properties: [{ name: 'inner', type: { kind: 'object', typeName: 'Inner', properties: [{ name: 'x', type: { kind: 'number' } }] } }],
        },
        { name: 'Inner', properties: [{ name: 'x', type: { kind: 'number' } }] },
      ]);
    });

    it('VALID: {array of a named object} => the element shape', () => {
      const result = collectNamedObjectTypesTransformer({
        descriptor: TypeDescriptorStub({
          kind: 'array',
          element: { kind: 'object', typeName: 'Item', properties: [{ name: 'id', type: { kind: 'string' } }] },
        }),
      });

      expect(result).toStrictEqual([{ name: 'Item', properties: [{ name: 'id', type: { kind: 'string' } }] }]);
    });

    it('VALID: {union containing a named object} => the object member', () => {
      const result = collectNamedObjectTypesTransformer({
        descriptor: TypeDescriptorStub({
          kind: 'union',
          members: [{ kind: 'string' }, { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }],
        }),
      });

      expect(result).toStrictEqual([{ name: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }]);
    });
  });

  describe('descriptors with no named object', () => {
    it('EMPTY: {a primitive} => no declared types', () => {
      expect(collectNamedObjectTypesTransformer({ descriptor: TypeDescriptorStub({ kind: 'number' }) })).toStrictEqual([]);
    });

    it('VALID: {anonymous object wrapping a named object} => only the named nested shape', () => {
      const result = collectNamedObjectTypesTransformer({
        descriptor: TypeDescriptorStub({
          kind: 'object',
          properties: [{ name: 'cfg', type: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] } }],
        }),
      });

      expect(result).toStrictEqual([{ name: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }]);
    });
  });
});
