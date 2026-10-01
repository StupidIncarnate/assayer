import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { substituteTypeRefsTransformer } from './substitute-type-refs-transformer';

describe('substituteTypeRefsTransformer', () => {
  describe('a reference the map carries', () => {
    it('VALID: {an opaque Config} => the declared shape in its place', () => {
      const type = TypeDescriptorStub({ kind: 'unknown', text: 'Config', typeRef: 'Config' });
      const config = TypeDescriptorStub({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });
    });

    it('VALID: {Config[]} => an array of the declared shape', () => {
      const type = TypeDescriptorStub({ kind: 'array', element: { kind: 'unknown', text: 'Config', typeRef: 'Config' } });
      const config = TypeDescriptorStub({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'array',
        element: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
      });
    });

    it('VALID: {an object with an opaque property} => the property filled in, the rest untouched', () => {
      const type = TypeDescriptorStub({
        kind: 'object',
        typeName: 'Outer',
        properties: [
          { name: 'inner', type: { kind: 'unknown', text: 'Config', typeRef: 'Config' } },
          { name: 'size', type: { kind: 'number' } },
        ],
      });
      const config = TypeDescriptorStub({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'object',
        typeName: 'Outer',
        properties: [
          {
            name: 'inner',
            type: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
          },
          { name: 'size', type: { kind: 'number' } },
        ],
      });
    });

    // The array's own cardinality is carried through unrelated to what its element resolves to — the
    // two travel on independent branches of the recursion, so a rewritten element must not drop it.
    it('VALID: {Config[] with a known cardinality} => the cardinality survives the element rewrite', () => {
      const type = TypeDescriptorStub({
        kind: 'array',
        element: { kind: 'unknown', text: 'Config', typeRef: 'Config' },
        cardinality: 3,
      });
      const config = TypeDescriptorStub({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'array',
        element: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
        cardinality: 3,
      });
    });

    // A property's own `optional` mark is the DECLARATION's, not the resolved shape's — it has to
    // survive the rewrite exactly as the truncation mark does below.
    it('VALID: {an optional property carrying an opaque type} => the rewrite keeps the optional mark', () => {
      const type = TypeDescriptorStub({
        kind: 'object',
        typeName: 'Outer',
        properties: [{ name: 'inner', type: { kind: 'unknown', text: 'Config', typeRef: 'Config' }, optional: true }],
      });
      const config = TypeDescriptorStub({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'object',
        typeName: 'Outer',
        properties: [
          {
            name: 'inner',
            type: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
            optional: true,
          },
        ],
      });
    });

    it('VALID: {a union with an opaque member} => the member replaced, the others kept', () => {
      const type = TypeDescriptorStub({
        kind: 'union',
        members: [{ kind: 'string' }, { kind: 'unknown', text: 'Config', typeRef: 'Config' }],
      });
      const config = TypeDescriptorStub({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'union',
        members: [
          { kind: 'string' },
          { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
        ],
      });
    });

    // The truncation mark is the READER's, and losing it would turn a self-referential shape into one
    // that reads as genuinely property-less — which `{}` would then wrongly satisfy.
    it('VALID: {a truncated object} => the truncation mark survives the rewrite', () => {
      const type = TypeDescriptorStub({ kind: 'object', typeName: 'Tree', truncated: true, properties: [] });
      const config = TypeDescriptorStub({ kind: 'string' });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'object',
        typeName: 'Tree',
        truncated: true,
        properties: [],
      });
    });

    // Descended the same way an array's element is, one substitution per fixed position — a
    // reference sitting inside any one of them still needs replacing.
    it('VALID: {a tuple with an opaque reference in one position} => that position replaced, the sibling kept', () => {
      const type = TypeDescriptorStub({
        kind: 'tuple',
        elements: [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }, { kind: 'number' }],
      });
      const config = TypeDescriptorStub({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'tuple',
        elements: [
          { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
          { kind: 'number' },
        ],
      });
    });

    it('VALID: {a tuple nested inside a tuple} => the reference two levels down is still replaced', () => {
      const type = TypeDescriptorStub({
        kind: 'tuple',
        elements: [
          { kind: 'tuple', elements: [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }] },
          { kind: 'string' },
        ],
      });
      const config = TypeDescriptorStub({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'tuple',
        elements: [
          {
            kind: 'tuple',
            elements: [{ kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }],
          },
          { kind: 'string' },
        ],
      });
    });

    it('EMPTY: {an empty tuple} => stays an empty tuple', () => {
      const type = TypeDescriptorStub({ kind: 'tuple', elements: [] });
      const config = TypeDescriptorStub({ kind: 'string' });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'tuple',
        elements: [],
      });
    });

    // The literal segments carry no reference to resolve; only each substitution's own type does.
    it('VALID: {a template substitution carrying an opaque reference} => the substitution replaced, the segments untouched', () => {
      const type = TypeDescriptorStub({
        kind: 'template',
        texts: ['id-', ''],
        types: [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }],
      });
      const config = TypeDescriptorStub({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'template',
        texts: ['id-', ''],
        types: [{ kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }],
      });
    });

    it('EMPTY: {a template with no substitutions} => stays an empty types list', () => {
      const type = TypeDescriptorStub({ kind: 'template', texts: ['literal'], types: [] });
      const config = TypeDescriptorStub({ kind: 'string' });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'template',
        texts: ['literal'],
        types: [],
      });
    });

    it('VALID: {a template substitution that is itself a tuple carrying a reference} => the reference replaced through both layers', () => {
      const type = TypeDescriptorStub({
        kind: 'template',
        texts: ['', ''],
        types: [{ kind: 'tuple', elements: [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }] }],
      });
      const config = TypeDescriptorStub({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'template',
        texts: ['', ''],
        types: [
          {
            kind: 'tuple',
            elements: [{ kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }],
          },
        ],
      });
    });

    it('VALID: {a tuple element that is itself a template carrying a reference} => the reference replaced through both layers', () => {
      const type = TypeDescriptorStub({
        kind: 'tuple',
        elements: [
          { kind: 'template', texts: ['id-', ''], types: [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }] },
        ],
      });
      const config = TypeDescriptorStub({
        kind: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', type: { kind: 'string' } }],
      });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'tuple',
        elements: [
          {
            kind: 'template',
            texts: ['id-', ''],
            types: [{ kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }],
          },
        ],
      });
    });
  });

  describe('a reference the map does not carry', () => {
    it('VALID: {an unresolved reference} => left exactly as read, so the fill seam still refuses it', () => {
      const type = TypeDescriptorStub({ kind: 'unknown', text: 'Widget', typeRef: 'Widget' });
      const config = TypeDescriptorStub({ kind: 'string' });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'unknown',
        text: 'Widget',
        typeRef: 'Widget',
      });
    });

    it('VALID: {a tuple with an unresolved reference} => left exactly as read', () => {
      const type = TypeDescriptorStub({
        kind: 'tuple',
        elements: [{ kind: 'unknown', text: 'Widget', typeRef: 'Widget' }],
      });
      const config = TypeDescriptorStub({ kind: 'string' });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'tuple',
        elements: [{ kind: 'unknown', text: 'Widget', typeRef: 'Widget' }],
      });
    });

    it('EMPTY: {an empty map} => the type unchanged', () => {
      const type = TypeDescriptorStub({ kind: 'string' });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map() })).toStrictEqual({ kind: 'string' });
    });

    it('VALID: {an opaque type with no typeRef} => unchanged, it was never a plain reference', () => {
      const type = TypeDescriptorStub({ kind: 'unknown', text: 'Config | string' });
      const config = TypeDescriptorStub({ kind: 'string' });

      expect(substituteTypeRefsTransformer({ type, resolved: new Map([['Config', config]]) })).toStrictEqual({
        kind: 'unknown',
        text: 'Config | string',
      });
    });
  });
});
