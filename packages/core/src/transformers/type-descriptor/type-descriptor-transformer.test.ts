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

    it('VALID: {union with a non-literal member} => unknown carrying the union text', () => {
      const fact = TypeFactStub({
        flavor: 'union',
        members: [{ flavor: 'literal', value: 'open' }, { flavor: 'other', text: 'undefined' }],
        text: '"open" | undefined',
      });

      expect(typeDescriptorTransformer({ fact })).toStrictEqual(
        TypeDescriptorStub({ kind: 'unknown', text: '"open" | undefined' }),
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
