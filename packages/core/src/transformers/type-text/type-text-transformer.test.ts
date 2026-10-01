import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { typeTextTransformer } from './type-text-transformer';

describe('typeTextTransformer', () => {
  describe('primitive descriptors', () => {
    it('VALID: {type: string} => returns "string"', () => {
      expect(typeTextTransformer({ type: { kind: 'string' } })).toBe('string');
    });

    it('VALID: {type: number} => returns "number"', () => {
      expect(typeTextTransformer({ type: { kind: 'number' } })).toBe('number');
    });

    it('VALID: {type: boolean} => returns "boolean"', () => {
      expect(typeTextTransformer({ type: { kind: 'boolean' } })).toBe('boolean');
    });

    it('VALID: {type: unknown void} => returns the carried text', () => {
      expect(typeTextTransformer({ type: TypeDescriptorStub({ kind: 'unknown', text: 'void' }) })).toBe('void');
    });
  });

  describe('composite descriptors', () => {
    it('VALID: {type: literal "a"} => returns the JSON form', () => {
      expect(typeTextTransformer({ type: TypeDescriptorStub({ kind: 'literal', value: 'a' }) })).toBe('"a"');
    });

    it('VALID: {type: union} => joins member texts with a pipe', () => {
      expect(
        typeTextTransformer({
          type: TypeDescriptorStub({
            kind: 'union',
            members: [TypeDescriptorStub({ kind: 'literal', value: 'a' }), { kind: 'string' }],
          }),
        }),
      ).toBe('"a" | string');
    });

    it('VALID: {type: array of number} => renders "number[]"', () => {
      expect(typeTextTransformer({ type: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }) })).toBe('number[]');
    });

    it('VALID: {type: named object} => renders the type name', () => {
      expect(
        typeTextTransformer({
          type: TypeDescriptorStub({ kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }),
        }),
      ).toBe('Config');
    });

    it('VALID: {type: callable} => renders the carried signature text', () => {
      expect(
        typeTextTransformer({ type: TypeDescriptorStub({ kind: 'callable', text: '(message: string) => string' }) }),
      ).toBe('(message: string) => string');
    });

    it('VALID: {type: anonymous object} => renders the braced property list', () => {
      expect(
        typeTextTransformer({
          type: TypeDescriptorStub({
            kind: 'object',
            properties: [
              { name: 'a', type: { kind: 'string' } },
              { name: 'b', type: { kind: 'number' } },
            ],
          }),
        }),
      ).toBe('{ a: string; b: number }');
    });

    it('EMPTY: {type: anonymous object with no properties} => renders the empty braces', () => {
      expect(typeTextTransformer({ type: TypeDescriptorStub({ kind: 'object', properties: [] }) })).toBe('{  }');
    });
  });

  describe('a tuple', () => {
    it('VALID: {type: tuple of string and number} => renders each position, comma-joined inside brackets', () => {
      expect(
        typeTextTransformer({ type: TypeDescriptorStub({ kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'number' }] }) }),
      ).toBe('[string, number]');
    });

    it('VALID: {type: tuple nested inside a tuple} => renders the inner tuple as its own bracketed position', () => {
      expect(
        typeTextTransformer({
          type: TypeDescriptorStub({
            kind: 'tuple',
            elements: [{ kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'boolean' }] }, { kind: 'number' }],
          }),
        }),
      ).toBe('[[string, boolean], number]');
    });

    it('EMPTY: {type: empty tuple} => renders empty brackets', () => {
      expect(typeTextTransformer({ type: TypeDescriptorStub({ kind: 'tuple', elements: [] }) })).toBe('[]');
    });
  });

  describe('a template literal type', () => {
    it('VALID: {type: template with one substitution} => renders a backtick string with the substitution as a `${}` hole', () => {
      expect(
        typeTextTransformer({
          type: TypeDescriptorStub({ kind: 'template', texts: ['id-', ''], types: [{ kind: 'string' }] }),
        }),
      ).toBe(`\`id-\${string}\``);
    });

    it('VALID: {type: template whose substitution is itself a union} => renders the union text inside the hole', () => {
      expect(
        typeTextTransformer({
          type: TypeDescriptorStub({
            kind: 'template',
            texts: ['id-', ''],
            types: [
              TypeDescriptorStub({
                kind: 'union',
                members: [TypeDescriptorStub({ kind: 'literal', value: 'a' }), { kind: 'string' }],
              }),
            ],
          }),
        }),
      ).toBe(`\`id-\${"a" | string}\``);
    });
  });
});
