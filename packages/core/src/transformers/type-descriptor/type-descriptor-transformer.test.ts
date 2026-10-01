import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { TypeFactStub } from '../../contracts/type-fact/type-fact.stub';
import { typeDescriptorTransformer } from './type-descriptor-transformer';

describe('typeDescriptorTransformer', () => {
  describe('primitive facts', () => {
    it('VALID: {flavor: string} => string descriptor', () => {
      expect(typeDescriptorTransformer({ fact: TypeFactStub({ flavor: 'string' }) })).toStrictEqual({ kind: 'string' });
    });

    it('VALID: {flavor: number} => number descriptor', () => {
      expect(typeDescriptorTransformer({ fact: TypeFactStub({ flavor: 'number' }) })).toStrictEqual({ kind: 'number' });
    });

    it('VALID: {flavor: boolean} => boolean descriptor', () => {
      expect(typeDescriptorTransformer({ fact: TypeFactStub({ flavor: 'boolean' }) })).toStrictEqual({
        kind: 'boolean',
      });
    });
  });

  describe('literal facts', () => {
    it('VALID: {flavor: literal, value} => literal descriptor', () => {
      expect(typeDescriptorTransformer({ fact: TypeFactStub({ flavor: 'literal', value: 'open' }) })).toStrictEqual(
        TypeDescriptorStub({ kind: 'literal', value: 'open' }),
      );
    });
  });

  describe('union facts', () => {
    it('VALID: {all-literal union} => union descriptor of literals', () => {
      const fact = TypeFactStub({
        flavor: 'union',
        members: [
          { flavor: 'literal', value: 'open' },
          { flavor: 'literal', value: 'closed' },
        ],
        text: '"open" | "closed"',
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({
          kind: 'union',
          members: [
            TypeDescriptorStub({ kind: 'literal', value: 'open' }),
            TypeDescriptorStub({ kind: 'literal', value: 'closed' }),
          ],
        }),
      );
    });

    it('VALID: {union of primitives} => union descriptor keeping both members', () => {
      const fact = TypeFactStub({
        flavor: 'union',
        members: [{ flavor: 'string' }, { flavor: 'number' }],
        text: 'string | number',
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({ kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] }),
      );
    });

    it('VALID: {union mixing a literal and a primitive} => union descriptor keeping both members', () => {
      const fact = TypeFactStub({
        flavor: 'union',
        members: [{ flavor: 'literal', value: 'open' }, { flavor: 'boolean' }],
        text: '"open" | boolean',
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({
          kind: 'union',
          members: [TypeDescriptorStub({ kind: 'literal', value: 'open' }), { kind: 'boolean' }],
        }),
      );
    });

    it('VALID: {union of a string and the two boolean literals} => union descriptor keeping all three members', () => {
      const fact = TypeFactStub({
        flavor: 'union',
        members: [{ flavor: 'string' }, { flavor: 'literal', value: false }, { flavor: 'literal', value: true }],
        text: 'string | boolean',
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({
          kind: 'union',
          members: [
            { kind: 'string' },
            TypeDescriptorStub({ kind: 'literal', value: false }),
            TypeDescriptorStub({ kind: 'literal', value: true }),
          ],
        }),
      );
    });

    // SOME member representable is enough: a value of one member IS a value of the union, so the half
    // that can be built survives and the fill seam picks it. Degrading here refused the whole type for
    // the half nothing can build, which contradicts `is-type-fillable`'s union rule.
    it('VALID: {union with an opaque member} => union descriptor keeping the opaque member beside the literal', () => {
      const fact = TypeFactStub({
        flavor: 'union',
        members: [{ flavor: 'literal', value: 'open' }, { flavor: 'other', text: 'undefined' }],
        text: '"open" | undefined',
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({
          kind: 'union',
          members: [TypeDescriptorStub({ kind: 'literal', value: 'open' }), { kind: 'unknown', text: 'undefined' }],
        }),
      );
    });

    it('VALID: {union with an object member} => union descriptor keeping the object beside the string', () => {
      const fact = TypeFactStub({
        flavor: 'union',
        members: [{ flavor: 'string' }, { flavor: 'object', typeName: 'Config', properties: [] }],
        text: 'string | Config',
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({
          kind: 'union',
          members: [{ kind: 'string' }, TypeDescriptorStub({ kind: 'object', typeName: 'Config', properties: [] })],
        }),
      );
    });

    it('VALID: {union where NO member is representable} => unknown carrying the union text', () => {
      const fact = TypeFactStub({
        flavor: 'union',
        members: [{ flavor: 'other', text: 'null' }, { flavor: 'other', text: 'undefined' }],
        text: 'null | undefined',
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({ kind: 'unknown', text: 'null | undefined' }),
      );
    });
  });

  describe('array facts', () => {
    it('VALID: {array of number} => array descriptor over a number element', () => {
      const fact = TypeFactStub({ flavor: 'array', element: { flavor: 'number' } });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }),
      );
    });
  });

  describe('tuple facts', () => {
    it('VALID: {tuple of string and number} => tuple descriptor with one descriptor per position', () => {
      const fact = TypeFactStub({ flavor: 'tuple', elements: [{ flavor: 'string' }, { flavor: 'number' }] });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'number' }] }),
      );
    });

    it('EMPTY: {an empty tuple} => tuple descriptor with no elements', () => {
      const fact = TypeFactStub({ flavor: 'tuple', elements: [] });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(TypeDescriptorStub({ kind: 'tuple', elements: [] }));
    });

    // Recursion goes more than one level: the inner tuple's own elements are re-parsed through the
    // same transformer, not merely copied across.
    it('VALID: {a tuple nested inside a tuple} => the inner tuple descriptor at its own position', () => {
      const fact = TypeFactStub({
        flavor: 'tuple',
        elements: [{ flavor: 'tuple', elements: [{ flavor: 'string' }] }, { flavor: 'number' }],
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({
          kind: 'tuple',
          elements: [{ kind: 'tuple', elements: [{ kind: 'string' }] }, { kind: 'number' }],
        }),
      );
    });

    it('VALID: {a tuple element that is an opaque reference} => the reference re-parsed through the same contract', () => {
      const fact = TypeFactStub({
        flavor: 'tuple',
        elements: [{ flavor: 'other', text: 'Config', typeRef: 'Config' }, { flavor: 'number' }],
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({
          kind: 'tuple',
          elements: [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }, { kind: 'number' }],
        }),
      );
    });

    it('VALID: {a tuple element that is itself a template} => the template descriptor at its own position', () => {
      const fact = TypeFactStub({
        flavor: 'tuple',
        elements: [{ flavor: 'template', texts: ['id-', ''], types: [{ flavor: 'string' }] }, { flavor: 'number' }],
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({
          kind: 'tuple',
          elements: [{ kind: 'template', texts: ['id-', ''], types: [{ kind: 'string' }] }, { kind: 'number' }],
        }),
      );
    });
  });

  describe('template facts', () => {
    it('VALID: {a template literal type} => template descriptor carrying the segments and substitution descriptors', () => {
      const fact = TypeFactStub({ flavor: 'template', texts: ['id-', ''], types: [{ flavor: 'string' }] });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({ kind: 'template', texts: ['id-', ''], types: [{ kind: 'string' }] }),
      );
    });

    it('EMPTY: {a template with no substitutions} => template descriptor with an empty types list', () => {
      const fact = TypeFactStub({ flavor: 'template', texts: ['literal'], types: [] });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({ kind: 'template', texts: ['literal'], types: [] }),
      );
    });

    it('VALID: {a template substitution that is an opaque reference} => the reference re-parsed through the same contract', () => {
      const fact = TypeFactStub({
        flavor: 'template',
        texts: ['id-', ''],
        types: [{ flavor: 'other', text: 'Config', typeRef: 'Config' }],
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({
          kind: 'template',
          texts: ['id-', ''],
          types: [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }],
        }),
      );
    });

    it('VALID: {a template substitution that is itself a tuple} => the tuple descriptor at its own position', () => {
      const fact = TypeFactStub({
        flavor: 'template',
        texts: ['', '-suffix'],
        types: [{ flavor: 'tuple', elements: [{ flavor: 'string' }, { flavor: 'number' }] }],
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({
          kind: 'template',
          texts: ['', '-suffix'],
          types: [{ kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'number' }] }],
        }),
      );
    });
  });

  describe('object facts', () => {
    it('VALID: {named object} => object descriptor carrying the name and mapped properties', () => {
      const fact = TypeFactStub({
        flavor: 'object',
        typeName: 'Config',
        properties: [
          { name: 'mode', fact: { flavor: 'string' } },
          { name: 'retries', fact: { flavor: 'number' } },
        ],
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({
          kind: 'object',
          typeName: 'Config',
          properties: [
            { name: 'mode', type: { kind: 'string' } },
            { name: 'retries', type: { kind: 'number' } },
          ],
        }),
      );
    });

    it('VALID: {anonymous object} => keyless object descriptor', () => {
      const fact = TypeFactStub({ flavor: 'object', properties: [{ name: 'a', fact: { flavor: 'string' } }] });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({ kind: 'object', properties: [{ name: 'a', type: { kind: 'string' } }] }),
      );
    });

    // The reader's truncation mark rides across, because nothing downstream can re-derive it.
    it('VALID: {a truncated object fact} => object descriptor carrying the truncation mark', () => {
      const fact = TypeFactStub({ flavor: 'object', typeName: 'Tree', truncated: true, properties: [] });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({ kind: 'object', typeName: 'Tree', truncated: true, properties: [] }),
      );
    });

    it('EMPTY: {an untruncated property-less object fact} => object descriptor with no truncation mark', () => {
      const fact = TypeFactStub({ flavor: 'object', typeName: 'Empty', properties: [] });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({ kind: 'object', typeName: 'Empty', properties: [] }),
      );
    });
  });

  describe('callable facts', () => {
    it('VALID: {flavor: callable} => callable descriptor carrying the signature text', () => {
      const fact = TypeFactStub({ flavor: 'callable', text: '(message: string) => string' });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({ kind: 'callable', text: '(message: string) => string' }),
      );
    });

    it('VALID: {object whose property is callable} => the property maps to a callable descriptor', () => {
      const fact = TypeFactStub({
        flavor: 'object',
        typeName: 'Sink',
        properties: [{ name: 'write', fact: { flavor: 'callable', text: '(line: string) => string' } }],
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({
          kind: 'object',
          typeName: 'Sink',
          properties: [{ name: 'write', type: { kind: 'callable', text: '(line: string) => string' } }],
        }),
      );
    });
  });

  describe('opaque facts', () => {
    it('VALID: {flavor: other} => unknown carrying the type text', () => {
      expect(typeDescriptorTransformer({ fact: TypeFactStub({ flavor: 'other', text: 'void' }) })).toStrictEqual(
        TypeDescriptorStub({ kind: 'unknown', text: 'void' }),
      );
    });

    // `typeRef` is the foreign key a consume-time overlay resolves an opaque reference by — carried
    // across, never re-derived from `text`, so a plain type reference (`config: Config`) stays
    // resolvable downstream.
    it('VALID: {flavor: other, typeRef: Config} => unknown carrying the reference name', () => {
      const fact = TypeFactStub({ flavor: 'other', text: 'Config', typeRef: 'Config' });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({ kind: 'unknown', text: 'Config', typeRef: 'Config' }),
      );
    });

    // A GENERIC reference (`Box<string>`) carries its type ARGUMENTS, each read through this SAME
    // transformer — `Box<string>` and `Box<number>` are one name and two demands, and it is the
    // argument that tells them apart downstream (`type-ref-key`).
    it('VALID: {flavor: other, typeRef: Box, typeArgs: [string]} => unknown carrying the resolved type argument', () => {
      const fact = TypeFactStub({
        flavor: 'other',
        text: 'Box<string>',
        typeRef: 'Box',
        typeArgs: [{ flavor: 'string' }],
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({ kind: 'unknown', text: 'Box<string>', typeRef: 'Box', typeArgs: [{ kind: 'string' }] }),
      );
    });
  });

  describe('property optionality', () => {
    // Carried through, never re-derived: the checker widens optionality away before any later stage
    // could ask, so a `mode?: string` property has to keep its own `optional` mark here.
    it('VALID: {an optional property} => the property descriptor carries optional: true', () => {
      const fact = TypeFactStub({
        flavor: 'object',
        typeName: 'Config',
        properties: [{ name: 'mode', fact: { flavor: 'string' }, optional: true }],
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({
          kind: 'object',
          typeName: 'Config',
          properties: [{ name: 'mode', type: { kind: 'string' }, optional: true }],
        }),
      );
    });
  });
});
