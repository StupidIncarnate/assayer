import { TypeDescriptorStub } from '@assayer/shared/contracts';

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
