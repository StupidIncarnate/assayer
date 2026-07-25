import { TypeDescriptorStub } from '@assayer/shared/contracts';

import { collectTypeRefsTransformer } from './collect-type-refs-transformer';

describe('collectTypeRefsTransformer', () => {
  describe('an opaque type declared as a plain reference', () => {
    it('VALID: {config: Config} => the reference itself, which carries more than its name', () => {
      const type = TypeDescriptorStub({ kind: 'unknown', text: 'Config', typeRef: 'Config' });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([
        { kind: 'unknown', text: 'Config', typeRef: 'Config' },
      ]);
    });

    it('VALID: {configs: Config[]} => the name on the array element', () => {
      const type = TypeDescriptorStub({
        kind: 'array',
        element: { kind: 'unknown', text: 'Config', typeRef: 'Config' },
      });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([
        { kind: 'unknown', text: 'Config', typeRef: 'Config' },
      ]);
    });

    it('VALID: {an object with an opaque property} => the property reference name', () => {
      const type = TypeDescriptorStub({
        kind: 'object',
        typeName: 'Config',
        properties: [
          { name: 'db', type: { kind: 'unknown', text: 'Db', typeRef: 'Db' } },
          { name: 'mode', type: { kind: 'string' } },
        ],
      });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([{ kind: 'unknown', text: 'Db', typeRef: 'Db' }]);
    });

    it('VALID: {a union with two opaque members} => both names in first-seen order', () => {
      const type = TypeDescriptorStub({
        kind: 'union',
        members: [
          { kind: 'unknown', text: 'Db', typeRef: 'Db' },
          { kind: 'string' },
          { kind: 'unknown', text: 'Cache', typeRef: 'Cache' },
        ],
      });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([
        { kind: 'unknown', text: 'Db', typeRef: 'Db' },
        { kind: 'unknown', text: 'Cache', typeRef: 'Cache' },
      ]);
    });

    it('VALID: {the same reference twice} => one entry, so resolution is asked once', () => {
      const type = TypeDescriptorStub({
        kind: 'object',
        properties: [
          { name: 'left', type: { kind: 'unknown', text: 'Db', typeRef: 'Db' } },
          { name: 'right', type: { kind: 'unknown', text: 'Db', typeRef: 'Db' } },
        ],
      });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([{ kind: 'unknown', text: 'Db', typeRef: 'Db' }]);
    });

    // `Box<string>` and `Box<number>` are one NAME and two demands: keyed on the name alone, a
    // resolution would answer one of them with the other's shape.
    it('VALID: {Box<string> and Box<number>} => two entries, because the key is the whole rendering', () => {
      const type = TypeDescriptorStub({
        kind: 'object',
        properties: [
          { name: 'left', type: { kind: 'unknown', text: 'Box<string>', typeRef: 'Box', typeArgs: [{ kind: 'string' }] } },
          { name: 'right', type: { kind: 'unknown', text: 'Box<number>', typeRef: 'Box', typeArgs: [{ kind: 'number' }] } },
        ],
      });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([
        { kind: 'unknown', text: 'Box<string>', typeRef: 'Box', typeArgs: [{ kind: 'string' }] },
        { kind: 'unknown', text: 'Box<number>', typeRef: 'Box', typeArgs: [{ kind: 'number' }] },
      ]);
    });

    it('VALID: {Box<Config>} => the reference AND the reference its argument names', () => {
      const type = TypeDescriptorStub({
        kind: 'unknown',
        text: 'Box<Config>',
        typeRef: 'Box',
        typeArgs: [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }],
      });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([
        {
          kind: 'unknown',
          text: 'Box<Config>',
          typeRef: 'Box',
          typeArgs: [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }],
        },
        { kind: 'unknown', text: 'Config', typeRef: 'Config' },
      ]);
    });
  });

  describe('a type that names no reference', () => {
    it('EMPTY: {a string} => no names', () => {
      const type = TypeDescriptorStub({ kind: 'string' });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([]);
    });

    it('EMPTY: {an opaque type with no typeRef} => no names, since it was never a plain reference', () => {
      const type = TypeDescriptorStub({ kind: 'unknown', text: 'Db | string' });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([]);
    });

    it('EMPTY: {a callable} => no names, it carries only the checker rendering', () => {
      const type = TypeDescriptorStub({ kind: 'callable', text: '(m: string) => void' });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([]);
    });

    it('EMPTY: {a literal} => no names', () => {
      const type = TypeDescriptorStub({ kind: 'literal', value: 'get' });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([]);
    });
  });
});
