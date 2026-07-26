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

    // Every member is walked, not just the first that carries a name — a flatMap over the whole
    // members list, not a find of one.
    it('VALID: {union of two named objects} => both shapes, in member order', () => {
      const result = collectNamedObjectTypesTransformer({
        descriptor: TypeDescriptorStub({
          kind: 'union',
          members: [
            { kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] },
            { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
          ],
        }),
      });

      expect(result).toStrictEqual([
        { name: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] },
        { name: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
      ]);
    });

    it('VALID: {a tuple element carrying a named object} => the named shape', () => {
      const result = collectNamedObjectTypesTransformer({
        descriptor: TypeDescriptorStub({
          kind: 'tuple',
          elements: [
            { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
            { kind: 'string' },
          ],
        }),
      });

      expect(result).toStrictEqual([{ name: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }]);
    });

    it('VALID: {a tuple nested inside a tuple, innermost carrying a named object} => the nested shape', () => {
      const result = collectNamedObjectTypesTransformer({
        descriptor: TypeDescriptorStub({
          kind: 'tuple',
          elements: [{ kind: 'tuple', elements: [{ kind: 'object', typeName: 'Inner', properties: [] }] }],
        }),
      });

      expect(result).toStrictEqual([{ name: 'Inner', properties: [] }]);
    });

    // Every position is walked, not just the first that carries a name — a flatMap over the whole
    // elements list, not a find of one.
    it('VALID: {two tuple positions each carrying a named object} => both shapes, in position order', () => {
      const result = collectNamedObjectTypesTransformer({
        descriptor: TypeDescriptorStub({
          kind: 'tuple',
          elements: [
            { kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] },
            { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
          ],
        }),
      });

      expect(result).toStrictEqual([
        { name: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] },
        { name: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
      ]);
    });

    it('VALID: {a template substitution carrying a named object} => the named shape', () => {
      const result = collectNamedObjectTypesTransformer({
        descriptor: TypeDescriptorStub({
          kind: 'template',
          texts: ['id-', ''],
          types: [{ kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }],
        }),
      });

      expect(result).toStrictEqual([{ name: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }]);
    });

    it('VALID: {a template whose substitution is itself a tuple carrying a named object} => the shape found through both layers', () => {
      const result = collectNamedObjectTypesTransformer({
        descriptor: TypeDescriptorStub({
          kind: 'template',
          texts: ['', ''],
          types: [{ kind: 'tuple', elements: [{ kind: 'object', typeName: 'Config', properties: [] }] }],
        }),
      });

      expect(result).toStrictEqual([{ name: 'Config', properties: [] }]);
    });

    it('VALID: {a tuple element that is itself a template carrying a named object} => the shape found through both layers', () => {
      const result = collectNamedObjectTypesTransformer({
        descriptor: TypeDescriptorStub({
          kind: 'tuple',
          elements: [{ kind: 'template', texts: ['id-', ''], types: [{ kind: 'object', typeName: 'Config', properties: [] }] }],
        }),
      });

      expect(result).toStrictEqual([{ name: 'Config', properties: [] }]);
    });
  });

  describe('descriptors with no named object', () => {
    it('EMPTY: {a primitive} => no declared types', () => {
      expect(collectNamedObjectTypesTransformer({ descriptor: TypeDescriptorStub({ kind: 'number' }) })).toStrictEqual([]);
    });

    it('EMPTY: {an empty tuple} => no declared types', () => {
      expect(
        collectNamedObjectTypesTransformer({ descriptor: TypeDescriptorStub({ kind: 'tuple', elements: [] }) }),
      ).toStrictEqual([]);
    });

    it('EMPTY: {a template with no substitutions} => no declared types', () => {
      expect(
        collectNamedObjectTypesTransformer({
          descriptor: TypeDescriptorStub({ kind: 'template', texts: ['literal'], types: [] }),
        }),
      ).toStrictEqual([]);
    });

    it('EMPTY: {a callable} => no declared types', () => {
      expect(
        collectNamedObjectTypesTransformer({
          descriptor: TypeDescriptorStub({ kind: 'callable', text: '(message: string) => string' }),
        }),
      ).toStrictEqual([]);
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
