import { objectStubContract } from './object-stub-contract';
import { ObjectStubStub } from './object-stub.stub';

describe('objectStubContract', () => {
  describe('valid object stubs', () => {
    it('VALID: {stub default} => carries its key, definition, properties, and readers', () => {
      const result = objectStubContract.parse(ObjectStubStub());

      expect(result).toStrictEqual({
        key: 'src/config/config.ts#Config',
        definitionRelPath: 'src/config/config.ts',
        typeName: 'Config',
        properties: [{ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } }],
        readers: ['src/config/config.ts'],
      });
    });

    it('VALID: {an unread property} => splices an unknown demand onto the property list', () => {
      const result = objectStubContract.parse(
        ObjectStubStub({
          properties: [
            { name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } },
            { name: 'retries', demand: { kind: 'unknown' } },
          ],
        }),
      );

      expect(result.properties).toStrictEqual([
        { name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } },
        { name: 'retries', demand: { kind: 'unknown' } },
      ]);
    });
  });

  describe('invalid object stubs', () => {
    it('INVALID: {no typeName} => throws validation error', () => {
      expect(() => {
        return objectStubContract.parse({
          key: 'src/config/config.ts#Config',
          definitionRelPath: 'src/config/config.ts',
          properties: [],
          readers: [],
        });
      }).toThrow(/Required/u);
    });
  });
});
