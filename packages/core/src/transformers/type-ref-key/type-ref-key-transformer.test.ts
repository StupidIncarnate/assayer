import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { typeRefKeyTransformer } from './type-ref-key-transformer';

describe('typeRefKeyTransformer', () => {
  describe('an opaque reference', () => {
    it('VALID: {config: Config} => the reference rendering', () => {
      const type = TypeDescriptorStub({ kind: 'unknown', text: 'Config', typeRef: 'Config' });

      expect(typeRefKeyTransformer({ type })).toBe('Config');
    });

    // The whole point of keying on the rendering: one NAME, two demands.
    it('VALID: {Box<string> and Box<number>} => two different keys under one name', () => {
      const stringBox = TypeDescriptorStub({
        kind: 'unknown',
        text: 'Box<string>',
        typeRef: 'Box',
        typeArgs: [{ kind: 'string' }],
      });
      const numberBox = TypeDescriptorStub({
        kind: 'unknown',
        text: 'Box<number>',
        typeRef: 'Box',
        typeArgs: [{ kind: 'number' }],
      });

      expect([typeRefKeyTransformer({ type: stringBox }), typeRefKeyTransformer({ type: numberBox })]).toStrictEqual([
        'Box<string>',
        'Box<number>',
      ]);
    });
  });

  describe('a descriptor that is not a reference', () => {
    it('EMPTY: {a string} => no key', () => {
      expect(typeRefKeyTransformer({ type: TypeDescriptorStub({ kind: 'string' }) })).toBe(undefined);
    });

    it('EMPTY: {an object} => no key', () => {
      const type = TypeDescriptorStub({ kind: 'object', typeName: 'Config', properties: [] });

      expect(typeRefKeyTransformer({ type })).toBe(undefined);
    });
  });
});
