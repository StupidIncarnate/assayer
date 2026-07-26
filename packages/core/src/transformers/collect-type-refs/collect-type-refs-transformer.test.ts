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

    it('VALID: {a tuple element carrying an opaque reference} => the reference at its position', () => {
      const type = TypeDescriptorStub({
        kind: 'tuple',
        elements: [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }, { kind: 'string' }],
      });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([
        { kind: 'unknown', text: 'Config', typeRef: 'Config' },
      ]);
    });

    it('VALID: {a tuple nested inside a tuple} => the reference two levels down is still found', () => {
      const type = TypeDescriptorStub({
        kind: 'tuple',
        elements: [{ kind: 'tuple', elements: [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }] }],
      });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([
        { kind: 'unknown', text: 'Config', typeRef: 'Config' },
      ]);
    });

    it('VALID: {two tuple positions each naming a reference} => both names, in position order', () => {
      const type = TypeDescriptorStub({
        kind: 'tuple',
        elements: [
          { kind: 'unknown', text: 'Db', typeRef: 'Db' },
          { kind: 'unknown', text: 'Cache', typeRef: 'Cache' },
        ],
      });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([
        { kind: 'unknown', text: 'Db', typeRef: 'Db' },
        { kind: 'unknown', text: 'Cache', typeRef: 'Cache' },
      ]);
    });

    // The literal segments carry no name; only each substitution's own type does.
    it('VALID: {a template substitution carrying an opaque reference} => the reference at its substitution', () => {
      const type = TypeDescriptorStub({
        kind: 'template',
        texts: ['id-', ''],
        types: [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }],
      });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([
        { kind: 'unknown', text: 'Config', typeRef: 'Config' },
      ]);
    });

    it('VALID: {a template whose substitution is itself a tuple carrying a reference} => the reference found through both layers', () => {
      const type = TypeDescriptorStub({
        kind: 'template',
        texts: ['', ''],
        types: [{ kind: 'tuple', elements: [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }] }],
      });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([
        { kind: 'unknown', text: 'Config', typeRef: 'Config' },
      ]);
    });

    it('VALID: {a tuple element that is itself a template carrying a reference} => the reference found through both layers', () => {
      const type = TypeDescriptorStub({
        kind: 'tuple',
        elements: [
          { kind: 'template', texts: ['id-', ''], types: [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }] },
        ],
      });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([
        { kind: 'unknown', text: 'Config', typeRef: 'Config' },
      ]);
    });
  });

  describe('a type that names no reference', () => {
    it('EMPTY: {a string} => no names', () => {
      const type = TypeDescriptorStub({ kind: 'string' });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([]);
    });

    it('EMPTY: {an empty tuple} => no names', () => {
      const type = TypeDescriptorStub({ kind: 'tuple', elements: [] });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([]);
    });

    it('EMPTY: {a template with no substitutions} => no names', () => {
      const type = TypeDescriptorStub({ kind: 'template', texts: ['literal'], types: [] });

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

    it('EMPTY: {an object with no properties} => no names', () => {
      const type = TypeDescriptorStub({ kind: 'object', properties: [] });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([]);
    });

    it('EMPTY: {a union with no members} => no names', () => {
      const type = TypeDescriptorStub({ kind: 'union', members: [] });

      expect(collectTypeRefsTransformer({ type })).toStrictEqual([]);
    });
  });
});
