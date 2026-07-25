import { TypeDescriptorStub } from '@assayer/shared/contracts';

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
  });
});
